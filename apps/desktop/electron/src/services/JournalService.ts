import { randomUUID } from 'crypto';

import { InsertVoucher, InsertVoucherEntry } from '@vyora/database';
import { ledgers, vouchers, voucher_entries } from '@vyora/database';
import { CreateVoucherInput } from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { DbTransaction } from '../repositories/BaseRepository';
import { journalRepository } from '../repositories/JournalRepository';

import { companyContextService } from './CompanyContextService';
import { financialYearContextService } from './FinancialYearContextService';
import { numberingEngineService } from './NumberingEngineService';
import { systemLedgerResolver } from './SystemLedgerResolverService';

export class JournalService {
  /**
   * Orchestrates the creation of a double-entry voucher.
   * Validates balancing (Debits === Credits) and checks financial year boundaries.
   *
   * @param input The voucher business payload.
   * @param tx The transaction object mandatory for atomic integration.
   * @returns Created Voucher details.
   */
  public async createVoucher(
    input: CreateVoucherInput,
    tx: DbTransaction,
  ): Promise<{ voucherId: string; voucherNumber: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    if (!fy.isActive) {
      throw new Error(
        `ERR_FINANCIAL_YEAR_LOCKED: Cannot post to closed financial year ${fy.label}`,
      );
    }

    // Financial Year Boundary Validation
    const vDate = new Date(input.voucherDate);
    const fyStartDate = new Date(fy.startDate);
    const fyEndDate = new Date(fy.endDate);

    if (vDate < fyStartDate || vDate > fyEndDate) {
      throw new Error(
        `ERR_INVALID_DATE: Voucher date ${vDate.toISOString()} is outside the bounds of financial year ${fy.label}`,
      );
    }

    // Validate Double-Entry Integrity (Integer Paise)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of input.entries) {
      if (!Number.isInteger(entry.debitAmount) || !Number.isInteger(entry.creditAmount)) {
        throw new Error('ERR_VALIDATION: All amounts must be integers (paise).');
      }
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;
    }

    if (totalDebit !== totalCredit) {
      throw new Error(
        `ERR_VALIDATION: Voucher does not balance. Debits (${totalDebit}) !== Credits (${totalCredit})`,
      );
    }

    // Construct Voucher Header
    const voucherId = randomUUID();
    const insertVoucher: InsertVoucher = {
      id: voucherId,
      companyId,
      financialYearId: fy.id,
      voucherType: input.voucherType,
      voucherNumber: input.voucherNumber,
      voucherDate: vDate,
      sourceModule: input.sourceModule,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      narration: input.narration,
      isCancelled: false,
      isFrozen: false,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Construct Entries
    const insertEntries: InsertVoucherEntry[] = input.entries.map((entry, index) => ({
      id: randomUUID(),
      voucherId,
      lineNumber: index + 1,
      ledgerId: entry.ledgerId,
      debitAmount: entry.debitAmount,
      creditAmount: entry.creditAmount,
      entryDate: vDate,
      narration: entry.narration,
      syncVersion: 1,
      createdAt: new Date(),
    }));

    // Perform Insertion
    await journalRepository.createVoucher(insertVoucher, insertEntries, tx);

    return {
      voucherId,
      voucherNumber: input.voucherNumber,
    };
  }

  public async postSalesInvoice(
    payload: {
      companyId: string;
      branchId?: string;
      financialYearId: string;
      invoiceId: string;
      invoiceDate: Date;
      customerId: string;
      totalTaxableAmount: number;
      totalCgst: number;
      totalSgst: number;
      totalIgst: number;
      totalInvoiceAmount: number;
      totalCogsAmount: number;
    },
    tx: DbTransaction,
  ): Promise<{ voucherId: string }> {
    // 1. Resolve Ledgers
    const customerLedger = tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, payload.companyId),
          eq(ledgers.referenceType, 'CUSTOMER'),
          eq(ledgers.referenceId, payload.customerId),
        ),
      )
      .get();

    if (!customerLedger) {
      throw new Error(`Customer ledger not found for customer ID ${payload.customerId}`);
    }

    const salesLedger = systemLedgerResolver.getSystemLedgerByName('Sales', tx);
    const outputCgst = systemLedgerResolver.getSystemLedgerByName('Output CGST', tx);
    const outputSgst = systemLedgerResolver.getSystemLedgerByName('Output SGST', tx);
    const outputIgst = systemLedgerResolver.getSystemLedgerByName('Output IGST', tx);
    const cogsLedger = systemLedgerResolver.getSystemLedgerByName('Cost of Goods Sold (COGS)', tx);
    const inventoryLedger = systemLedgerResolver.getSystemLedgerByName('Inventory', tx);

    // 2. Build Entries
    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Customer Debit
    entries.push({
      ledgerId: customerLedger.id,
      debitAmount: payload.totalInvoiceAmount,
      creditAmount: 0,
      narration: `Sales Invoice ${payload.invoiceId}`,
    });

    // Sales Credit
    entries.push({
      ledgerId: salesLedger.id,
      debitAmount: 0,
      creditAmount: payload.totalTaxableAmount,
      narration: `Sales Invoice ${payload.invoiceId}`,
    });

    // Output GST Credits
    if (payload.totalCgst > 0) {
      entries.push({
        ledgerId: outputCgst.id,
        debitAmount: 0,
        creditAmount: payload.totalCgst,
      });
    }
    if (payload.totalSgst > 0) {
      entries.push({
        ledgerId: outputSgst.id,
        debitAmount: 0,
        creditAmount: payload.totalSgst,
      });
    }
    if (payload.totalIgst > 0) {
      entries.push({
        ledgerId: outputIgst.id,
        debitAmount: 0,
        creditAmount: payload.totalIgst,
      });
    }

    // COGS Debit & Inventory Credit (Perpetual Inventory)
    if (payload.totalCogsAmount > 0) {
      entries.push({
        ledgerId: cogsLedger.id,
        debitAmount: payload.totalCogsAmount,
        creditAmount: 0,
        narration: `COGS for Invoice ${payload.invoiceId}`,
      });
      entries.push({
        ledgerId: inventoryLedger.id,
        debitAmount: 0,
        creditAmount: payload.totalCogsAmount,
        narration: `Inventory asset reduction for Invoice ${payload.invoiceId}`,
      });
    }

    // Generate Voucher Number
    const generatedVoucherNumber = await numberingEngineService.generateNextNumber(
      payload.companyId,
      payload.financialYearId,
      'JOURNAL_VOUCHER',
      tx,
    );

    // 3. Delegate to createVoucher
    const voucherInput: CreateVoucherInput = {
      voucherType: 'Sales',
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.invoiceDate,
      sourceModule: 'SalesInvoiceService',
      referenceType: 'SALES_INVOICE',
      referenceId: payload.invoiceId,
      narration: `Sales Invoice generated`,
      entries,
    };

    const { voucherId } = await this.createVoucher(voucherInput, tx);

    return { voucherId };
  }

  public async postPurchaseBill(
    payload: {
      companyId: string;
      financialYearId: string;
      invoiceId: string;
      invoiceDate: Date;
      supplierId: string;
      totalTaxableAmount: number;
      totalCgst: number;
      totalSgst: number;
      totalIgst: number;
      totalInvoiceAmount: number;
      roundOffAmount: number;
    },
    tx: DbTransaction,
  ): Promise<{ voucherId: string }> {
    // 1. Resolve Ledgers
    const supplierLedger = tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, payload.companyId),
          eq(ledgers.referenceType, 'SUPPLIER'),
          eq(ledgers.referenceId, payload.supplierId),
        ),
      )
      .get();

    if (!supplierLedger) {
      throw new Error(`Supplier ledger not found for supplier ID ${payload.supplierId}`);
    }

    const inputCgst = systemLedgerResolver.getSystemLedgerByName('Input CGST', tx);
    const inputSgst = systemLedgerResolver.getSystemLedgerByName('Input SGST', tx);
    const inputIgst = systemLedgerResolver.getSystemLedgerByName('Input IGST', tx);
    const inventoryLedger = systemLedgerResolver.getSystemLedgerByName('Inventory', tx);
    const roundOffLedger = systemLedgerResolver.getSystemLedgerByName('Round Off', tx);

    // 2. Build Entries
    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Inventory Debit (Asset Increase)
    entries.push({
      ledgerId: inventoryLedger.id,
      debitAmount: payload.totalTaxableAmount,
      creditAmount: 0,
      narration: `Purchase Bill ${payload.invoiceId}`,
    });

    // Input GST Debits
    if (payload.totalCgst > 0) {
      entries.push({
        ledgerId: inputCgst.id,
        debitAmount: payload.totalCgst,
        creditAmount: 0,
      });
    }
    if (payload.totalSgst > 0) {
      entries.push({
        ledgerId: inputSgst.id,
        debitAmount: payload.totalSgst,
        creditAmount: 0,
      });
    }
    if (payload.totalIgst > 0) {
      entries.push({
        ledgerId: inputIgst.id,
        debitAmount: payload.totalIgst,
        creditAmount: 0,
      });
    }

    // Supplier Credit
    entries.push({
      ledgerId: supplierLedger.id,
      debitAmount: 0,
      creditAmount: payload.totalInvoiceAmount,
      narration: `Purchase Bill ${payload.invoiceId}`,
    });

    // Round Off Entry
    if (payload.roundOffAmount > 0) {
      entries.push({
        ledgerId: roundOffLedger.id,
        debitAmount: Math.abs(payload.roundOffAmount),
        creditAmount: 0,
        narration: `Round off for ${payload.invoiceId}`,
      });
    } else if (payload.roundOffAmount < 0) {
      entries.push({
        ledgerId: roundOffLedger.id,
        debitAmount: 0,
        creditAmount: Math.abs(payload.roundOffAmount),
        narration: `Round off for ${payload.invoiceId}`,
      });
    }

    // Generate Voucher Number
    const generatedVoucherNumber = await numberingEngineService.generateNextNumber(
      payload.companyId,
      payload.financialYearId,
      'JOURNAL_VOUCHER',
      tx,
    );

    // 3. Delegate to createVoucher
    const voucherInput: CreateVoucherInput = {
      voucherType: 'Purchase',
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.invoiceDate,
      sourceModule: 'PurchaseService',
      referenceType: 'PURCHASE_BILL',
      referenceId: payload.invoiceId,
      narration: `Purchase Bill generated`,
      entries,
    };

    const { voucherId } = await this.createVoucher(voucherInput, tx);

    return { voucherId };
  }

  public async reverseSalesInvoice(
    invoiceId: string,
    tx: DbTransaction,
  ): Promise<{ reversalVoucherId: string }> {
    const companyId = companyContextService.getActiveCompany() as string;

    // 1. Locate original Sales voucher
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.referenceType, 'SALES_INVOICE'),
          eq(vouchers.referenceId, invoiceId),
        ),
      )
      .all();

    if (originalVouchers.length === 0) {
      throw new Error(`Original voucher not found for Sales Invoice ${invoiceId}`);
    }
    if (originalVouchers.length > 1) {
      throw new Error(`Multiple original vouchers found for Sales Invoice ${invoiceId}`);
    }

    const originalVoucher = originalVouchers[0];

    if (originalVoucher.isCancelled) {
      throw new Error(`Voucher ${originalVoucher.voucherNumber} is already cancelled`);
    }

    // 2. Fetch original voucher entries
    const originalEntries = tx
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, originalVoucher.id))
      .all();

    if (originalEntries.length === 0) {
      throw new Error(`No entries found for voucher ${originalVoucher.voucherNumber}`);
    }

    // 3. Build Reversal Entries (Swap Debits and Credits)
    const reversalEntries = originalEntries.map((entry) => ({
      ledgerId: entry.ledgerId,
      debitAmount: entry.creditAmount, // Swap
      creditAmount: entry.debitAmount, // Swap
      narration: `Reversal for Sales Invoice ${invoiceId}`,
    }));

    // Generate Voucher Number
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    const generatedVoucherNumber = await numberingEngineService.generateNextNumber(
      companyId,
      fy.id,
      'JOURNAL_VOUCHER',
      tx,
    );

    // 4. Create Reversal Voucher
    const reversalInput: CreateVoucherInput = {
      voucherType: 'Journal', // Reversals are usually journals
      voucherNumber: generatedVoucherNumber,
      voucherDate: new Date(), // Reversal happens today/now
      sourceModule: 'SalesInvoiceService',
      referenceType: 'SALES_INVOICE_CANCELLATION',
      referenceId: invoiceId,
      narration: `Cancellation Reversal for ${originalVoucher.voucherNumber}`,
      entries: reversalEntries,
    };

    const { voucherId: reversalVoucherId } = await this.createVoucher(reversalInput, tx);

    // 5. Optionally, mark original voucher as cancelled (if required by design, though prompt said "DO NOT mutate original voucher entries". Marking the header as cancelled is usually required to link them or just leaving it is fine as long as balances offset. Let's just update header isCancelled)
    tx.update(vouchers)
      .set({ isCancelled: true, reversalVoucherId })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { reversalVoucherId };
  }
  public async reversePurchaseBill(
    purchaseId: string,
    tx: DbTransaction,
  ): Promise<{ reversalVoucherId: string }> {
    const companyId = companyContextService.getActiveCompany() as string;

    // 1. Locate original Purchase voucher
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.referenceType, 'PURCHASE_BILL'),
          eq(vouchers.referenceId, purchaseId),
        ),
      )
      .all();

    if (originalVouchers.length === 0) {
      throw new Error(`Original voucher not found for Purchase Bill ${purchaseId}`);
    }
    if (originalVouchers.length > 1) {
      throw new Error(`Multiple original vouchers found for Purchase Bill ${purchaseId}`);
    }

    const originalVoucher = originalVouchers[0];

    if (originalVoucher.isCancelled) {
      throw new Error(`Voucher ${originalVoucher.voucherNumber} is already cancelled`);
    }

    // 2. Fetch original voucher entries
    const originalEntries = tx
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, originalVoucher.id))
      .all();

    if (originalEntries.length === 0) {
      throw new Error(`No entries found for voucher ${originalVoucher.voucherNumber}`);
    }

    // 3. Build Reversal Entries (Swap Debits and Credits)
    const reversalEntries = originalEntries.map((entry) => ({
      ledgerId: entry.ledgerId,
      debitAmount: entry.creditAmount, // Swap
      creditAmount: entry.debitAmount, // Swap
      narration: `Reversal for Purchase Bill ${purchaseId}`,
    }));

    // Generate Voucher Number
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    const generatedVoucherNumber = await numberingEngineService.generateNextNumber(
      companyId,
      fy.id,
      'JOURNAL_VOUCHER',
      tx,
    );

    // 4. Create Reversal Voucher
    const reversalInput: CreateVoucherInput = {
      voucherType: 'Journal',
      voucherNumber: generatedVoucherNumber,
      voucherDate: new Date(),
      sourceModule: 'PurchaseService',
      referenceType: 'PURCHASE_BILL_CANCELLATION',
      referenceId: purchaseId,
      narration: `Cancellation Reversal for ${originalVoucher.voucherNumber}`,
      entries: reversalEntries,
    };

    const { voucherId: reversalVoucherId } = await this.createVoucher(reversalInput, tx);

    // 5. Mark original voucher as cancelled
    tx.update(vouchers)
      .set({ isCancelled: true, reversalVoucherId })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { reversalVoucherId };
  }
}

export const journalService = new JournalService();
