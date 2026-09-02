import { randomUUID } from 'crypto';
import * as path from 'path';

import {
  companies,
  financial_years,
  vouchers,
  voucher_entries,
  suppliers,
  customers,
  products,
  taxes,
  sales_invoices,
  ledgers,
  settlement_allocations,
} from '@vyora/database';
import * as schema from '@vyora/database';
import { CreatePurchaseInput, CreateSalesInvoiceInput, PaymentAccountDto } from '@vyora/types';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { companyContextService } from '../../src/services/CompanyContextService';
import { dbService } from '../../src/services/database/DatabaseService';
import { systemLedgerSeeder } from '../../src/services/database/SystemLedgerSeeder';
import { documentNumberingService } from '../../src/services/DocumentNumberingService';
import { financialYearContextService } from '../../src/services/FinancialYearContextService';
import { journalService } from '../../src/services/JournalService';
import { paymentAccountService } from '../../src/services/PaymentAccountService';
import { purchaseService } from '../../src/services/PurchaseService';
import { salesInvoiceService } from '../../src/services/SalesInvoiceService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

describe('Payment Accounting End-To-End Suite (Phase H)', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;
  let fyId: string;

  let sbiBank: PaymentAccountDto;
  let cashAccount: PaymentAccountDto;
  let phonePeUpi: PaymentAccountDto;
  let inactiveBank: PaymentAccountDto;

  let supplierAId: string;
  let supplierLedgerId: string;
  let customerLedgerId: string;
  let customerAId: string;
  let productAId: string;
  let unitAId: string;
  let taxAId: string;

  beforeEach(async () => {
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, {
      schema: schema as unknown as Record<string, unknown>,
    }) as unknown as ReturnType<typeof drizzle>;
    vi.spyOn(dbService, 'getDb').mockReturnValue(
      db as unknown as ReturnType<typeof dbService.getDb>,
    );

    migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), 'packages/database/drizzle'),
    });

    supplierLedgerId = randomUUID();
    customerLedgerId = randomUUID();

    companyId = randomUUID();
    fyId = randomUUID();

    db.insert(companies)
      .values({
        id: companyId,
        legalName: 'E2E Payment Testing Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(financial_years)
      .values({
        id: fyId,
        label: 'FY 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
      })
      .run();

    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
      companyId: '',
    });
    let seq = 1;
    vi.spyOn(documentNumberingService, 'generateNextNumberSync').mockImplementation(
      () => `DOC-${seq++}`,
    );

    systemLedgerSeeder.seedSystemLedgers(
      db as unknown as import('../../src/repositories/BaseRepository').DbTransaction,
    );

    cashAccount = await paymentAccountService.create({
      accountType: 'CASH',
      displayName: 'Main Cash',
      qrEnabled: false,
      isDefault: true,
      isActive: true,
      displayOrder: 1,
    });

    sbiBank = await paymentAccountService.create({
      accountType: 'BANK',
      displayName: 'SBI Bank',
      accountNumber: '2222',
      qrEnabled: false,
      isDefault: false,
      isActive: true,
      displayOrder: 2,
    });

    phonePeUpi = await paymentAccountService.create({
      accountType: 'UPI',
      displayName: 'PhonePe',
      upiId: 'test@ybl',
      qrEnabled: true,
      isDefault: false,
      isActive: true,
      displayOrder: 3,
    });

    inactiveBank = await paymentAccountService.create({
      accountType: 'BANK',
      displayName: 'Old Bank',
      accountNumber: '9999',
      qrEnabled: false,
      isDefault: false,
      isActive: false,
      displayOrder: 4,
    });

    supplierAId = randomUUID();
    db.insert(suppliers)
      .values({
        id: supplierAId,
        name: 'Supplier A',
        supplierCode: 'SUP-A',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    customerAId = randomUUID();
    db.insert(customers)
      .values({
        id: customerAId,
        name: 'Customer A',
        customerCode: 'CUS-A',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    taxAId = randomUUID();
    db.insert(taxes)
      .values({
        id: taxAId,
        name: 'GST 0%',
        rate: 0,
        isActive: true,
        createdAt: new Date(),
      })
      .run();

    unitAId = randomUUID();
    db.insert(schema.units)
      .values({
        id: unitAId,
        name: 'Numbers',
        shortName: 'NOS',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    productAId = randomUUID();
    db.insert(products)
      .values({
        id: productAId,
        name: 'Product A',
        sku: 'SKU-001',
        itemType: 'SERVICE',
        unitId: unitAId,
        taxId: taxAId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    const creditorsGroup = db
      .select()
      .from(schema.ledger_groups)
      .where(
        and(eq(schema.ledger_groups.name, 'Sundry Creditors'), eq(schema.ledger_groups.companyId)),
      )
      .get();
    const debtorsGroup = db
      .select()
      .from(schema.ledger_groups)
      .where(
        and(eq(schema.ledger_groups.name, 'Sundry Debtors'), eq(schema.ledger_groups.companyId)),
      )
      .get();

    db.insert(schema.ledgers)
      .values({
        id: supplierLedgerId,
        companyId,
        name: 'Supplier A',
        groupId: creditorsGroup?.id || randomUUID(),
        referenceType: 'SUPPLIER',
        referenceId: supplierAId,
        openingType: 'Cr',
        openingBalance: 0,
        isSystemAccount: false,
        allowManualPosting: true,
        isFrozen: false,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(schema.ledgers)
      .values({
        id: customerLedgerId,
        companyId,
        name: 'Customer A',
        groupId: debtorsGroup?.id || randomUUID(),
        referenceType: 'CUSTOMER',
        referenceId: customerAId,
        openingType: 'Dr',
        openingBalance: 0,
        isSystemAccount: false,
        allowManualPosting: true,
        isFrozen: false,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createPurchase = async (amount: number) => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'PURCHASE',
      supplierId: supplierAId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: amount,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: amount,
      lines: [
        {
          productId: productAId,
          description: 'Line 1',
          quantity: 1,
          rate: amount,
          taxableAmount: amount,
          lineTotal: amount,
          discountAmount: 0,
          taxAmount: 0,
          taxId: taxAId,
          igstAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          cessAmount: 0,
          unitId: unitAId,
        },
      ],
    };
    const id = await purchaseService.create(input);
    await purchaseService.submitPurchase(id);
    return id;
  };

  const createSales = async (amount: number) => {
    const input: CreateSalesInvoiceInput = {
      financialYearId: fyId,
      customerId: customerAId,
      invoiceDate: new Date('2026-05-01'),
      isReverseCharge: false,
      subtotal: amount,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: amount,
      items: [
        {
          productId: productAId,
          description: 'Line 1',
          quantity: 1,
          rate: amount,
          taxableAmount: amount,
          lineTotal: amount,
          discountAmount: 0,
          taxAmount: 0,
          taxId: taxAId,
          igstAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          cessAmount: 0,
          unitId: unitAId,
        },
      ],
    };
    const id = await salesInvoiceService.createInvoice(input);
    await salesInvoiceService.submitInvoice(id.invoiceId);
    return id.invoiceId;
  };

  const verifyAccountingEntry = (
    voucherId: string,
    expectedDebitLedgerId: string,
    expectedCreditLedgerId: string,
    amount: number,
  ) => {
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucherId))
      .all();
    expect(entries.length).toBe(2);

    const debitEntry = entries.find((e) => e.debitAmount > 0);
    const creditEntry = entries.find((e) => e.creditAmount > 0);

    expect(debitEntry).toBeDefined();
    expect(creditEntry).toBeDefined();

    expect(debitEntry!.ledgerId).toBe(expectedDebitLedgerId);
    expect(debitEntry!.debitAmount).toBe(amount);

    expect(creditEntry!.ledgerId).toBe(expectedCreditLedgerId);
    expect(creditEntry!.creditAmount).toBe(amount);
  };

  const getPartyLedgerId = (partyType: 'SUPPLIER' | 'CUSTOMER', partyId: string) => {
    return db
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId),
          eq(ledgers.referenceType, partyType),
          eq(ledgers.referenceId, partyId),
        ),
      )
      .get()!.id;
  };

  // 1-3. Purchase Payments
  it('1. Purchase Payment -> CASH', async () => {
    const invId = await createPurchase(10000);
    const res = await purchaseService.recordPayment(invId, {
      amount: 10000,
      paymentMode: 'CASH',
      paymentAccountId: cashAccount.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    expect(voucher.voucherType).toBe('Payment');

    verifyAccountingEntry(
      voucher.id,
      getPartyLedgerId('SUPPLIER', supplierAId),
      cashAccount.ledgerId,
      10000,
    );
  });

  it('2. Purchase Payment -> BANK', async () => {
    const invId = await createPurchase(20000);
    const res = await purchaseService.recordPayment(invId, {
      amount: 20000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    verifyAccountingEntry(
      voucher.id,
      getPartyLedgerId('SUPPLIER', supplierAId),
      sbiBank.ledgerId,
      20000,
    );
  });

  it('3. Purchase Payment -> UPI', async () => {
    const invId = await createPurchase(30000);
    const res = await purchaseService.recordPayment(invId, {
      amount: 30000,
      paymentMode: 'UPI',
      paymentAccountId: phonePeUpi.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    verifyAccountingEntry(
      voucher.id,
      getPartyLedgerId('SUPPLIER', supplierAId),
      phonePeUpi.ledgerId,
      30000,
    );
  });

  // 4-6. Sales Receipts
  it('4. Sales Receipt -> CASH', async () => {
    const invId = await createSales(10000);
    const res = await salesInvoiceService.recordPayment(invId, {
      amount: 10000,
      paymentMode: 'CASH',
      paymentAccountId: cashAccount.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    expect(voucher.voucherType).toBe('Receipt');
    verifyAccountingEntry(
      voucher.id,
      cashAccount.ledgerId,
      getPartyLedgerId('CUSTOMER', customerAId),
      10000,
    );
  });

  it('5. Sales Receipt -> BANK', async () => {
    const invId = await createSales(20000);
    const res = await salesInvoiceService.recordPayment(invId, {
      amount: 20000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    verifyAccountingEntry(
      voucher.id,
      sbiBank.ledgerId,
      getPartyLedgerId('CUSTOMER', customerAId),
      20000,
    );
  });

  it('6. Sales Receipt -> UPI', async () => {
    const invId = await createSales(30000);
    const res = await salesInvoiceService.recordPayment(invId, {
      amount: 30000,
      paymentMode: 'UPI',
      paymentAccountId: phonePeUpi.id,
      paymentDate: new Date(),
    });

    const voucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, res.settlementId))
      .get()!;
    verifyAccountingEntry(
      voucher.id,
      phonePeUpi.ledgerId,
      getPartyLedgerId('CUSTOMER', customerAId),
      30000,
    );
  });

  it('7. Partial Payment', async () => {
    const invId = await createSales(10000);
    await salesInvoiceService.recordPayment(invId, {
      amount: 4000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });
  });

  it('8. Multiple Partial Payments & 9. Full Payment', async () => {
    const invId = await createSales(10000);
    await salesInvoiceService.recordPayment(invId, {
      amount: 4000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });

    await salesInvoiceService.recordPayment(invId, {
      amount: 6000,
      paymentMode: 'CASH',
      paymentAccountId: cashAccount.id,
      paymentDate: new Date(),
    });

    const dbInv = db.select().from(sales_invoices).where(eq(sales_invoices.id, invId)).get()!;
    expect(dbInv.status).toBe('PAID');
  });

  it('10. Overpayment Rejection', async () => {
    const invId = await createSales(10000);
    await expect(
      salesInvoiceService.recordPayment(invId, {
        amount: 10001,
        paymentMode: 'BANK',
        paymentAccountId: sbiBank.id,
        paymentDate: new Date(),
      }),
    ).rejects.toThrow(/Cannot allocate 10001/);

    // Ensure no settlements were created
    const sets = db
      .select()
      .from(settlement_allocations)
      .where(eq(settlement_allocations.documentId, invId))
      .all();
    expect(sets.length).toBe(0);
  });

  it('11. Inactive Account Rejection', async () => {
    const invId = await createSales(10000);
    await expect(
      salesInvoiceService.recordPayment(invId, {
        amount: 10000,
        paymentMode: 'BANK',
        paymentAccountId: inactiveBank.id,
        paymentDate: new Date(),
      }),
    ).rejects.toThrow(/inactive/);
  });

  it('12. Journal Failure Rollback', async () => {
    const invId = await createSales(10000);

    // Mock journalService to fail
    vi.spyOn(journalService, 'postReceiptSync').mockImplementation(() => {
      throw new Error('Forced Journal Error');
    });

    await expect(
      salesInvoiceService.recordPayment(invId, {
        amount: 10000,
        paymentMode: 'BANK',
        paymentAccountId: sbiBank.id,
        paymentDate: new Date(),
      }),
    ).rejects.toThrow(/Forced Journal Error/); // Reverted
    const sets = db
      .select()
      .from(settlement_allocations)
      .where(eq(settlement_allocations.documentId, invId))
      .all();
    expect(sets.length).toBe(0); // Reverted
  });

  it('13. Cancel Unpaid Invoice', async () => {
    const invId = await createSales(10000);
    await salesInvoiceService.cancelInvoice(invId);
  });

  it('14. Cancel Partially Paid Invoice', async () => {
    const invId = await createSales(10000);
    await salesInvoiceService.recordPayment(invId, {
      amount: 4000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });

    await salesInvoiceService.cancelInvoice(invId);

    // Settlement must STILL exist
    const sets = db
      .select()
      .from(settlement_allocations)
      .where(eq(settlement_allocations.documentId, invId))
      .all();
    expect(sets.length).toBe(1);
  });

  it('15. Cancel Fully Paid Invoice', async () => {
    const invId = await createSales(10000);
    await salesInvoiceService.recordPayment(invId, {
      amount: 10000,
      paymentMode: 'BANK',
      paymentAccountId: sbiBank.id,
      paymentDate: new Date(),
    });

    await salesInvoiceService.cancelInvoice(invId);

    // Settlement must STILL exist
    const sets = db
      .select()
      .from(settlement_allocations)
      .where(eq(settlement_allocations.documentId, invId))
      .all();
    expect(sets.length).toBe(1);
  });
});
