import { randomUUID } from 'crypto';

import { InsertVoucher, InsertVoucherEntry } from '@vyora/database';
import { ledgers, vouchers, voucher_entries, payment_accounts } from '@vyora/database';
import {
  CreateVoucherInput,
  VoucherListItemDto,
  VoucherFilterDto,
  VoucherDetailDto,
  TrialBalanceDto,
  LedgerStatementDto,
  AccountingDashboardDto,
  FinancialOverviewChartRequestDto,
  FinancialOverviewChartResponseDto,
} from '@vyora/types';
import { DocumentType } from '@vyora/types';
import { eq, and, sql, inArray } from 'drizzle-orm';

import { DbTransaction, TransactionExecutor } from '../repositories/BaseRepository';
import { journalRepository } from '../repositories/JournalRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { profitLossService } from './ProfitLossService';
import { systemLedgerResolver } from './SystemLedgerResolverService';
import { trialBalanceService } from './TrialBalanceService';

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

  public postTransfer(
    payload: {
      fromPaymentAccountId: string;
      toPaymentAccountId: string;
      amount: number;
      transferDate: Date;
      narration?: string;
    },
    tx: DbTransaction,
  ): { voucherId: string } {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    // 1. Resolve Ledger IDs from Payment Accounts synchronously
    const fromAccount = tx
      .select({
        ledgerId: payment_accounts.ledgerId,
        openingBalance: ledgers.openingBalance,
        openingType: ledgers.openingType,
      })
      .from(payment_accounts)
      .innerJoin(ledgers, eq(ledgers.id, payment_accounts.ledgerId))
      .where(eq(payment_accounts.id, payload.fromPaymentAccountId))
      .get();

    const toAccount = tx
      .select({ ledgerId: payment_accounts.ledgerId })
      .from(payment_accounts)
      .where(eq(payment_accounts.id, payload.toPaymentAccountId))
      .get();

    if (!fromAccount || !toAccount) {
      throw new Error('Could not resolve payment accounts to ledgers.');
    }

    if (fromAccount.ledgerId === toAccount.ledgerId) {
      throw new Error('Cannot transfer to the same ledger.');
    }

    // 2. Validate Available Balance
    const baseValue =
      (fromAccount.openingType === 'Dr' ? 1 : -1) * (fromAccount.openingBalance || 0);

    const totals = tx
      .select({
        totalDebit: sql<number>`COALESCE(SUM(${voucher_entries.debitAmount}), 0)`.mapWith(Number),
        totalCredit: sql<number>`COALESCE(SUM(${voucher_entries.creditAmount}), 0)`.mapWith(Number),
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucher_entries.ledgerId, fromAccount.ledgerId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, fy.id),
          eq(vouchers.isCancelled, false),
        ),
      )
      .get();

    const currentValue = baseValue + (totals?.totalDebit || 0) - (totals?.totalCredit || 0);

    // Convert to minor units (paise) safely
    const amountInPaise = payload.amount;

    if (!Number.isInteger(amountInPaise)) {
      throw new Error('ERR_VALIDATION: Transfer amount must be an integer (paise).');
    }

    if (currentValue < amountInPaise) {
      const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
      const availableRs = currentValue / 100;
      throw new Error(`Insufficient balance. Available balance: ${formatter.format(availableRs)}`);
    }

    const entries = [
      {
        ledgerId: toAccount.ledgerId,
        debitAmount: amountInPaise,
        creditAmount: 0,
        narration: payload.narration,
      },
      {
        ledgerId: fromAccount.ledgerId,
        debitAmount: 0,
        creditAmount: amountInPaise,
        narration: payload.narration,
      },
    ];

    const voucherNumber = documentNumberingService.generateNextNumberSync(
      companyId,
      DocumentType.CONTRA_VOUCHER,
      fy.id,
      tx,
    );

    const result = this.createVoucherSync(
      companyId,
      fy.id,
      {
        voucherType: 'Contra',
        voucherNumber,
        voucherDate: payload.transferDate,
        sourceModule: 'ACCOUNTING',
        referenceType: 'FUND_TRANSFER',
        referenceId: null,
        narration: payload.narration,
        entries,
      },
      tx,
    );

    return { voucherId: result.voucherId };
  }

  public cancelTransferSync(voucherId: string, tx: DbTransaction): { cancelledVoucherId: string } {
    const originalVouchers = tx.select().from(vouchers).where(eq(vouchers.id, voucherId)).all();

    if (originalVouchers.length === 0) throw new Error('Voucher not found');
    const originalVoucher = originalVouchers[0];

    if (originalVoucher.isCancelled) throw new Error('Transfer is already cancelled');
    if (
      originalVoucher.voucherType !== 'Contra' ||
      originalVoucher.referenceType !== 'FUND_TRANSFER'
    ) {
      throw new Error('Only Contra FUND_TRANSFER vouchers can be cancelled via cancelTransferSync');
    }

    journalRepository.cancelVoucher(voucherId, tx);
    return { cancelledVoucherId: voucherId };
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
    const generatedVoucherNumber = await documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.JOURNAL_VOUCHER,
      payload.financialYearId,
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
      totalInventoryAmount: number;
      totalExpenseAmount: number;
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
    const purchasesLedger = systemLedgerResolver.getSystemLedgerByName('Purchases', tx);
    const roundOffLedger = systemLedgerResolver.getSystemLedgerByName('Round Off', tx);

    // 2. Build Entries
    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Inventory Debit (Asset Increase)
    if (payload.totalInventoryAmount > 0) {
      entries.push({
        ledgerId: inventoryLedger.id,
        debitAmount: payload.totalInventoryAmount,
        creditAmount: 0,
        narration: `Purchase Bill ${payload.invoiceId} (Inventory)`,
      });
    }

    // Purchases Debit (Expenses)
    if (payload.totalExpenseAmount > 0) {
      entries.push({
        ledgerId: purchasesLedger.id,
        debitAmount: payload.totalExpenseAmount,
        creditAmount: 0,
        narration: `Purchase Bill ${payload.invoiceId} (Services/Non-Inventory)`,
      });
    }

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
    const generatedVoucherNumber = await documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.JOURNAL_VOUCHER,
      payload.financialYearId,
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

  public postExpenseBillSync(
    payload: {
      companyId: string;
      financialYearId: string;
      invoiceId: string;
      invoiceDate: Date;
      supplierId?: string | null;
      paymentAccountId?: string | null;
      lines: {
        expenseLedgerId: string;
        amount: number;
      }[];
      totalCgst: number;
      totalSgst: number;
      totalIgst: number;
      totalInvoiceAmount: number;
      roundOffAmount: number;
    },
    tx: TransactionExecutor,
  ): { voucherId: string } {
    const inputCgst = systemLedgerResolver.getSystemLedgerByName('Input CGST', tx);
    const inputSgst = systemLedgerResolver.getSystemLedgerByName('Input SGST', tx);
    const inputIgst = systemLedgerResolver.getSystemLedgerByName('Input IGST', tx);
    const roundOffLedger = systemLedgerResolver.getSystemLedgerByName('Round Off', tx);

    // 1. Resolve Credit Ledger (Payment Account OR Supplier)
    let creditLedgerId: string;

    if (payload.paymentAccountId) {
      // Immediate Payment (Cash Expense) -> Credit Payment Account
      // Immediate Payment (Cash Expense) -> Credit Payment Account
      const paymentAccount = tx
        .select()
        .from(payment_accounts)
        .where(
          and(
            eq(payment_accounts.id, payload.paymentAccountId),
            eq(payment_accounts.companyId, payload.companyId),
          ),
        )
        .get();

      if (!paymentAccount) {
        throw new Error(`Payment account not found for ID ${payload.paymentAccountId}`);
      }
      creditLedgerId = paymentAccount.ledgerId;
    } else if (payload.supplierId) {
      // Credit Expense (Unpaid) -> Credit Supplier
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
      creditLedgerId = supplierLedger.id;
    } else {
      throw new Error('Expense must have either a paymentAccountId or a supplierId');
    }

    // 2. Build Entries
    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Expense Debits (Line by line or aggregated)
    for (const line of payload.lines) {
      if (line.amount > 0) {
        entries.push({
          ledgerId: line.expenseLedgerId,
          debitAmount: line.amount,
          creditAmount: 0,
          narration: `Expense for Bill ${payload.invoiceId}`,
        });
      }
    }

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

    // Credit Entry
    entries.push({
      ledgerId: creditLedgerId,
      debitAmount: 0,
      creditAmount: payload.totalInvoiceAmount,
      narration: `Expense Bill ${payload.invoiceId}`,
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
    const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.JOURNAL_VOUCHER,
      payload.financialYearId,
      tx,
    );

    // 3. Delegate to createVoucher
    const voucherInput: CreateVoucherInput = {
      voucherType: 'Purchase', // Even for expenses, voucherType might be Purchase, Journal or a new one. Let's keep it Purchase for now as it's a purchase bill under the hood. Or 'Journal'. Let's use 'Purchase'.
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.invoiceDate,
      sourceModule: 'PurchaseService',
      referenceType: 'PURCHASE_BILL',
      referenceId: payload.invoiceId,
      narration: `Expense Bill generated`,
      entries,
    };

    const { voucherId } = this.createVoucherSync(
      payload.companyId,
      payload.financialYearId,
      voucherInput,
      tx,
    );

    return { voucherId };
  }

  public async reverseSalesInvoice(
    invoiceId: string,
    tx: DbTransaction,
  ): Promise<{ cancelledVoucherId: string }> {
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

    tx.update(vouchers)
      .set({
        isCancelled: true,
        referenceId: `${originalVoucher.referenceId}-CANC-${Date.now()}`,
      })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { cancelledVoucherId: originalVoucher.id };
  }
  public async reversePurchaseBill(
    purchaseId: string,
    tx: DbTransaction,
  ): Promise<{ cancelledVoucherId: string }> {
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

    tx.update(vouchers)
      .set({
        isCancelled: true,
        referenceId: `${originalVoucher.referenceId}-CANC-${Date.now()}`,
      })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { cancelledVoucherId: originalVoucher.id };
  }

  public async cancelVoucher(
    voucherId: string,
    options?: { allowSystemVoucherCancellation?: boolean },
  ): Promise<{ cancelledVoucherId: string }> {
    const companyId = companyContextService.getActiveCompany() as string;
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    return dbService.getDb().transaction(async (tx) => {
      const originalVouchers = tx
        .select()
        .from(vouchers)
        .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
        .all();

      if (originalVouchers.length === 0) throw new Error('Voucher not found');
      const originalVoucher = originalVouchers[0];

      if (originalVoucher.isCancelled) throw new Error('Voucher is already cancelled');
      if (originalVoucher.referenceType !== 'MANUAL' && !options?.allowSystemVoucherCancellation) {
        throw new Error('Only manually created vouchers can be cancelled directly.');
      }

      journalRepository.cancelVoucher(voucherId, tx);
      return { cancelledVoucherId: voucherId };
    });
  }

  public async reverseVoucher(voucherId: string): Promise<{ reversalVoucherId: string }> {
    const companyId = companyContextService.getActiveCompany() as string;
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    return dbService.getDb().transaction(async (tx) => {
      const originalVouchers = tx
        .select()
        .from(vouchers)
        .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
        .all();

      if (originalVouchers.length === 0) throw new Error('Voucher not found');
      const originalVoucher = originalVouchers[0];

      if (originalVoucher.isCancelled) throw new Error('Cannot reverse a cancelled voucher');
      if (originalVoucher.referenceType !== 'MANUAL') {
        throw new Error('Only manually created vouchers can be reversed directly.');
      }

      const originalEntries = tx
        .select()
        .from(voucher_entries)
        .where(eq(voucher_entries.voucherId, originalVoucher.id))
        .all();

      const reversalEntries = originalEntries.map((entry) => ({
        ledgerId: entry.ledgerId,
        debitAmount: entry.creditAmount,
        creditAmount: entry.debitAmount,
        narration: `Reversal for Voucher ${originalVoucher.voucherNumber}`,
      }));

      const generatedVoucherNumber = await documentNumberingService.generateNextNumberSync(
        companyId,
        DocumentType.JOURNAL_VOUCHER,
        fy.id,
        tx,
      );

      const reversalInput: CreateVoucherInput = {
        voucherType: 'Journal',
        voucherNumber: generatedVoucherNumber,
        voucherDate: new Date(),
        sourceModule: 'JournalService',
        referenceType: 'MANUAL' as const,
        referenceId: originalVoucher.id,
        narration: `Reversal for ${originalVoucher.voucherNumber}`,
        entries: reversalEntries,
      };

      const { voucherId: reversalVoucherId } = await this.createVoucher(reversalInput, tx);

      // Do NOT mark the original as cancelled for a standard reversal

      return { reversalVoucherId };
    });
  }

  public async getVoucherById(voucherId: string): Promise<VoucherDetailDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    const voucher = await journalRepository.getVoucherById(voucherId);
    if (voucher.companyId !== companyId)
      throw new Error('Voucher does not belong to active company');
    return voucher;
  }

  public async listVouchers(filter: VoucherFilterDto): Promise<VoucherListItemDto[]> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId) throw new Error('No active company found');
    if (!fy) throw new Error('No active financial year context');

    return await journalRepository.listVouchers(companyId, fy.id, filter);
  }

  public async getTrialBalance(): Promise<TrialBalanceDto> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId) throw new Error('No active company found');
    if (!fy) throw new Error('No active financial year context');

    const rows = await journalRepository.getTrialBalance(companyId, fy.id);

    let totalDebit = 0;
    let totalCredit = 0;
    for (const row of rows) {
      totalDebit += row.debitTotal;
      totalCredit += row.creditTotal;
    }

    if (totalDebit !== totalCredit) {
      throw new Error(
        `TRIAL_BALANCE_IMBALANCE: Debits (${totalDebit}) do not match Credits (${totalCredit})`,
      );
    }

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: true,
    };
  }

  public async getActiveLedgers(): Promise<{ id: string; name: string }[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    return await journalRepository.getActiveLedgers(companyId);
  }

  public async getLedgerStatement(
    ledgerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LedgerStatementDto> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId) throw new Error('No active company found');
    if (!fy) throw new Error('No active financial year context');

    const result = await journalRepository.getLedgerStatement(
      companyId,
      fy.id,
      ledgerId,
      fromDate,
      toDate,
    );

    let ledgerName = 'Unknown';
    const ledger = dbService
      .getDb()
      .select({ name: ledgers.name })
      .from(ledgers)
      .where(eq(ledgers.id, ledgerId))
      .get();
    if (ledger) ledgerName = ledger.name;

    let currentNet = (result.openingType === 'Dr' ? 1 : -1) * result.openingBalance;

    for (const row of result.rows) {
      currentNet += row.debitAmount - row.creditAmount;
      row.balance = Math.abs(currentNet);
      row.balanceType = currentNet >= 0 ? 'Dr' : 'Cr';
    }

    const closingBalance = Math.abs(currentNet);
    const closingType = currentNet >= 0 ? 'Dr' : 'Cr';

    return {
      ledgerId,
      ledgerName,
      openingBalance: result.openingBalance,
      openingType: result.openingType,
      rows: result.rows,
      closingBalance,
      closingType,
    };
  }

  public async getDashboardMetrics(): Promise<AccountingDashboardDto> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId) throw new Error('No active company found');
    if (!fy) throw new Error('No active financial year context');

    // 1. Fetch DB metrics
    const data = await journalRepository.getDashboardMetricsData(companyId, fy.id);

    // 2. Fetch Trial Balance status
    const tb = await trialBalanceService.getTrialBalance(companyId, fy.id, new Date());
    const isBalanced = tb.grandTotalDebit === tb.grandTotalCredit;
    const difference = Math.abs(tb.grandTotalDebit - tb.grandTotalCredit);

    // 3. Fetch current Profit/Loss
    const pl = await profitLossService.getProfitLoss(companyId, fy.id, new Date());
    const currentProfitLoss = pl.isProfit ? pl.netResult.amount : -pl.netResult.amount;

    // 4. Calculate Financial Overview (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyEntries = await journalRepository.getVoucherEntriesByDateRange(
      companyId,
      fy.id,
      startOfMonth,
      endOfMonth,
    );

    const dailyMap = new Map<string, { income: number; expense: number }>();

    // Initialize map with all days in the month
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      dailyMap.set(d.toISOString().split('T')[0], { income: 0, expense: 0 });
    }

    for (const entry of monthlyEntries) {
      const dateStr = entry.voucherDate.toISOString().split('T')[0];
      const stats = dailyMap.get(dateStr);
      if (stats) {
        if (entry.nature === 'Income') {
          // Increase income if Cr, decrease if Dr
          stats.income += entry.creditAmount - entry.debitAmount;
        } else if (entry.nature === 'Expense') {
          // Increase expense if Dr, decrease if Cr
          stats.expense += entry.debitAmount - entry.creditAmount;
        }
      }
    }

    const financialOverview = Array.from(dailyMap.entries()).map(([dateStr, stats]) => ({
      date: new Date(dateStr),
      income: stats.income,
      expense: stats.expense,
      netProfit: stats.income - stats.expense,
    }));

    return {
      totalLedgers: data.totalLedgers,
      totalJournalEntries: data.totalJournalEntries,
      trialBalanceStatus: { isBalanced, difference },
      currentProfitLoss,
      financialOverview,
      recentJournals: data.recentJournals,
      lastUpdatedAt: data.lastUpdatedAt,
    };
  }

  public async getFinancialOverviewChart(
    req: FinancialOverviewChartRequestDto,
  ): Promise<FinancialOverviewChartResponseDto[]> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId) throw new Error('No active company found');
    if (!fy) throw new Error('No active financial year context');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day';

    switch (req.timeRange) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        groupBy = 'day';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28);
        groupBy = 'week';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        groupBy = 'day';
        break;
      case 'quarterly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        groupBy = 'quarter';
        break;
      case 'half-yearly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        groupBy = 'month'; // Or custom half-year logic
        break;
      case 'annually':
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        groupBy = 'year';
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        groupBy = 'day';
    }

    const entries = await journalRepository.getVoucherEntriesByDateRange(
      companyId,
      fy.id,
      startDate,
      endDate,
    );

    const dataMap = new Map<string, FinancialOverviewChartResponseDto>();

    // Helper to format key based on grouping
    const getGroupKey = (date: Date): { key: string; label: string; dateObj: Date } => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const d = date.getDate();
      switch (groupBy) {
        case 'day':
          return {
            key: date.toISOString().split('T')[0],
            label: `${d} ${date.toLocaleString('en', { month: 'short' })}`,
            dateObj: date,
          };
        case 'week': {
          // Simple weekly grouping by ISO week string could be complex. Let's just use start of week date
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          return {
            key: startOfWeek.toISOString().split('T')[0],
            label: `Week of ${startOfWeek.getDate()} ${startOfWeek.toLocaleString('en', { month: 'short' })}`,
            dateObj: startOfWeek,
          };
        }
        case 'month':
          return {
            key: `${year}-${month + 1}`,
            label: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
            dateObj: new Date(year, month, 1),
          };
        case 'quarter': {
          const q = Math.floor(month / 3) + 1;
          return {
            key: `${year}-Q${q}`,
            label: `Q${q} ${year}`,
            dateObj: new Date(year, (q - 1) * 3, 1),
          };
        }
        case 'year':
          return { key: `${year}`, label: `${year}`, dateObj: new Date(year, 0, 1) };
        default:
          return {
            key: date.toISOString().split('T')[0],
            label: date.toISOString().split('T')[0],
            dateObj: date,
          };
      }
    };

    // We can pre-fill the map for 'daily' and 'monthly' (which is by day for current month) to ensure no gaps.
    // For others, we just let it populate dynamically or we can pre-populate.
    // Pre-populate for day grouping
    if (groupBy === 'day') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const { key, label, dateObj } = getGroupKey(new Date(d));
        dataMap.set(key, { date: dateObj, income: 0, expense: 0, netProfit: 0, label });
      }
    }

    for (const entry of entries) {
      const { key, label, dateObj } = getGroupKey(entry.voucherDate);
      if (!dataMap.has(key)) {
        dataMap.set(key, { date: dateObj, income: 0, expense: 0, netProfit: 0, label });
      }
      const stats = dataMap.get(key)!;
      if (entry.nature === 'Income') {
        stats.income += entry.creditAmount - entry.debitAmount;
      } else if (entry.nature === 'Expense') {
        stats.expense += entry.debitAmount - entry.creditAmount;
      }
    }

    const results = Array.from(dataMap.values()).map((stats) => {
      stats.netProfit = stats.income - stats.expense;
      return stats;
    });

    results.sort((a, b) => a.date.getTime() - b.date.getTime());

    return results;
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  public createVoucherSync(
    companyId: string,
    financialYearId: string,
    input: CreateVoucherInput,
    tx: TransactionExecutor,
  ): { voucherId: string; voucherNumber: string } {
    if (input.entries.length < 2) {
      throw new Error('A voucher must have at least two entries');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const insertEntries: InsertVoucherEntry[] = [];
    let lineNumber = 1;

    for (const entry of input.entries) {
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;

      insertEntries.push({
        id: randomUUID(),
        voucherId: '',
        lineNumber: lineNumber++,
        ledgerId: entry.ledgerId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        narration: entry.narration || input.narration,
        entryDate: input.voucherDate as Date,
        createdAt: new Date(),
      });
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Voucher imbalanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }

    const insertVoucher: InsertVoucher = {
      id: randomUUID(),
      companyId,
      financialYearId,
      voucherType: input.voucherType,
      voucherNumber: input.voucherNumber,
      voucherDate: input.voucherDate as Date,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      sourceModule: input.sourceModule,
      narration: input.narration,
      isCancelled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = journalRepository.createVoucher(insertVoucher, insertEntries, tx);

    return {
      voucherId: created.id,
      voucherNumber: created.voucherNumber,
    };
  }

  public postPurchaseBillSync(
    payload: {
      companyId: string;
      financialYearId: string;
      invoiceId: string;
      invoiceDate: Date;
      supplierId: string;
      totalInventoryAmount: number;
      totalExpenseAmount: number;
      totalCgst: number;
      totalSgst: number;
      totalIgst: number;
      totalInvoiceAmount: number;
      roundOffAmount: number;
    },
    tx: TransactionExecutor,
  ): { voucherId: string } {
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
    const purchasesLedger = systemLedgerResolver.getSystemLedgerByName('Purchases', tx);
    const roundOffLedger = systemLedgerResolver.getSystemLedgerByName('Round Off', tx);

    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    if (payload.totalInventoryAmount > 0) {
      entries.push({
        ledgerId: inventoryLedger.id,
        debitAmount: payload.totalInventoryAmount,
        creditAmount: 0,
        narration: `Purchase Bill ${payload.invoiceId} (Inventory)`,
      });
    }

    if (payload.totalExpenseAmount > 0) {
      entries.push({
        ledgerId: purchasesLedger.id,
        debitAmount: payload.totalExpenseAmount,
        creditAmount: 0,
        narration: `Purchase Bill ${payload.invoiceId} (Services/Non-Inventory)`,
      });
    }

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

    entries.push({
      ledgerId: supplierLedger.id,
      debitAmount: 0,
      creditAmount: payload.totalInvoiceAmount,
      narration: `Purchase Bill ${payload.invoiceId}`,
    });

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

    const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.JOURNAL_VOUCHER,
      payload.financialYearId,
      tx,
    );

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

    const { voucherId } = this.createVoucherSync(
      payload.companyId,
      payload.financialYearId,
      voucherInput,
      tx,
    );

    return { voucherId };
  }

  public reversePurchaseBillSync(
    purchaseId: string,
    tx: TransactionExecutor,
  ): { cancelledVoucherId: string } {
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.referenceType, 'PURCHASE_BILL'), eq(vouchers.referenceId, purchaseId)))
      .all();

    if (originalVouchers.length === 0) {
      throw new Error(`Original voucher not found for Purchase Bill ${purchaseId}`);
    }
    if (originalVouchers.length > 1) {
      throw new Error(`Multiple original vouchers found for Purchase Bill ${purchaseId}`);
    }

    const originalVoucher = originalVouchers[0];
    const financialYearId = originalVoucher.financialYearId;

    if (!financialYearId) {
      throw new Error('Original voucher has no financial year ID');
    }

    if (originalVoucher.isCancelled) {
      throw new Error(`Voucher ${originalVoucher.voucherNumber} is already cancelled`);
    }

    tx.update(vouchers)
      .set({
        isCancelled: true,
        referenceId: `${originalVoucher.referenceId}-CANC-${Date.now()}`,
      })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { cancelledVoucherId: originalVoucher.id };
  }

  public postSalesInvoiceSync(
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
    tx: TransactionExecutor,
  ): { voucherId: string } {
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

    // COGS & Inventory Reduction
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

    const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.JOURNAL_VOUCHER,
      payload.financialYearId,
      tx,
    );

    const voucherInput: CreateVoucherInput = {
      voucherType: 'Journal', // Using standard Journal voucher
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.invoiceDate,
      sourceModule: 'SalesInvoiceService',
      referenceType: 'SALES_INVOICE',
      referenceId: payload.invoiceId,
      narration: `Sales Invoice generated`,
      entries,
    };

    const { voucherId } = this.createVoucherSync(
      payload.companyId,
      payload.financialYearId,
      voucherInput,
      tx,
    );

    return { voucherId };
  }

  public reverseSalesInvoiceSync(
    invoiceId: string,
    tx: TransactionExecutor,
  ): { cancelledVoucherId: string } {
    // Find original voucher without relying on context service — search by invoiceId only
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.referenceType, 'SALES_INVOICE'), eq(vouchers.referenceId, invoiceId)))
      .all();

    if (originalVouchers.length === 0) {
      throw new Error(`Original voucher not found for Sales Invoice ${invoiceId}`);
    }

    const originalVoucher = originalVouchers[0];

    tx.update(vouchers)
      .set({
        isCancelled: true,
        referenceId: `${originalVoucher.referenceId}-CANC-${Date.now()}`,
      })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { cancelledVoucherId: originalVoucher.id };
  }

  public postReceiptSync(
    payload: {
      companyId: string;
      financialYearId: string;
      settlementId: string;
      settlementDate: Date;
      partyId: string;
      bankLedgerId: string;
      amount: number;
      narration?: string;
    },
    tx: TransactionExecutor,
  ): { voucherId: string } {
    const customerLedger = tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, payload.companyId),
          eq(ledgers.referenceType, 'CUSTOMER'),
          eq(ledgers.referenceId, payload.partyId),
        ),
      )
      .get();

    if (!customerLedger) {
      throw new Error(`Customer ledger not found for customer ID ${payload.partyId}`);
    }

    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Bank Debit
    entries.push({
      ledgerId: payload.bankLedgerId,
      debitAmount: payload.amount,
      creditAmount: 0,
      narration: payload.narration || `Receipt for Settlement ${payload.settlementId}`,
    });

    // Customer Credit
    entries.push({
      ledgerId: customerLedger.id,
      debitAmount: 0,
      creditAmount: payload.amount,
      narration: payload.narration || `Receipt for Settlement ${payload.settlementId}`,
    });

    const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.RECEIPT_VOUCHER,
      payload.financialYearId,
      tx,
    );

    const voucherInput: CreateVoucherInput = {
      voucherType: 'Receipt',
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.settlementDate,
      sourceModule: 'SettlementService',
      referenceType: 'RECEIPT',
      referenceId: payload.settlementId,
      narration: payload.narration || `Receipt generated for Settlement`,
      entries,
    };

    const { voucherId } = this.createVoucherSync(
      payload.companyId,
      payload.financialYearId,
      voucherInput,
      tx,
    );

    return { voucherId };
  }

  public postPaymentSync(
    payload: {
      companyId: string;
      financialYearId: string;
      settlementId: string;
      settlementDate: Date;
      partyId: string;
      bankLedgerId: string;
      amount: number;
      narration?: string;
    },
    tx: TransactionExecutor,
  ): { voucherId: string } {
    const supplierLedger = tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, payload.companyId),
          eq(ledgers.referenceType, 'SUPPLIER'),
          eq(ledgers.referenceId, payload.partyId),
        ),
      )
      .get();

    if (!supplierLedger) {
      throw new Error(`Supplier ledger not found for supplier ID ${payload.partyId}`);
    }

    const entries: {
      ledgerId: string;
      debitAmount: number;
      creditAmount: number;
      narration?: string;
    }[] = [];

    // Supplier Debit
    entries.push({
      ledgerId: supplierLedger.id,
      debitAmount: payload.amount,
      creditAmount: 0,
      narration: payload.narration || `Payment for Settlement ${payload.settlementId}`,
    });

    // Bank Credit
    entries.push({
      ledgerId: payload.bankLedgerId,
      debitAmount: 0,
      creditAmount: payload.amount,
      narration: payload.narration || `Payment for Settlement ${payload.settlementId}`,
    });

    const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
      payload.companyId,
      DocumentType.PAYMENT_VOUCHER,
      payload.financialYearId,
      tx,
    );

    const voucherInput: CreateVoucherInput = {
      voucherType: 'Payment',
      voucherNumber: generatedVoucherNumber,
      voucherDate: payload.settlementDate,
      sourceModule: 'SettlementService',
      referenceType: 'PAYMENT',
      referenceId: payload.settlementId,
      narration: payload.narration || `Payment generated for Settlement`,
      entries,
    };

    const { voucherId } = this.createVoucherSync(
      payload.companyId,
      payload.financialYearId,
      voucherInput,
      tx,
    );

    return { voucherId };
  }

  public reverseSettlementVoucherSync(
    settlementId: string,
    tx: TransactionExecutor,
  ): { cancelledVoucherId: string } {
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(
        and(
          inArray(vouchers.referenceType, ['RECEIPT', 'PAYMENT']),
          eq(vouchers.referenceId, settlementId),
          eq(vouchers.isCancelled, false),
        ),
      )
      .all();

    if (originalVouchers.length === 0) {
      throw new Error(`Active voucher not found for Settlement ${settlementId}`);
    }
    if (originalVouchers.length > 1) {
      throw new Error(`Multiple active vouchers found for Settlement ${settlementId}`);
    }

    const originalVoucher = originalVouchers[0];

    tx.update(vouchers)
      .set({
        isCancelled: true,
        updatedAt: new Date(),
      })
      .where(eq(vouchers.id, originalVoucher.id))
      .run();

    return { cancelledVoucherId: originalVoucher.id };
  }
}

export const journalService = new JournalService();
