import { randomUUID } from 'crypto';
import * as path from 'path';

import {
  companies,
  financial_years,
  vouchers,
  voucher_entries,
  suppliers,
  products,
  taxes,
  expense_presets,
  purchase_invoice_items,
  ledgers,
} from '@vyora/database';
import * as schema from '@vyora/database';
import { CreatePurchaseInput, PaymentAccountDto } from '@vyora/types';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { companyContextService } from '../../src/services/CompanyContextService';
import { dbService } from '../../src/services/database/DatabaseService';
import { systemExpensePresetSeeder } from '../../src/services/database/SystemExpensePresetSeeder';
import { systemLedgerSeeder } from '../../src/services/database/SystemLedgerSeeder';
import { documentNumberingService } from '../../src/services/DocumentNumberingService';
import { financialYearContextService } from '../../src/services/FinancialYearContextService';
import { paymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';
import { paymentAccountService } from '../../src/services/PaymentAccountService';
import { purchaseService } from '../../src/services/PurchaseService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

describe('Purchase and Expense Accounting Validation Suite', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;
  let fyId: string;
  let companyBId: string;

  let hdfcBank: PaymentAccountDto;
  let sbiBank: PaymentAccountDto;

  let supplierAId: string;
  let supplierBId: string;

  let productAId: string;
  let taxAId: string;

  let rentPresetId: string;
  let electricityPresetId: string;

  beforeEach(async () => {
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, {
      schema: schema as unknown as Record<string, unknown>,
    }) as unknown as ReturnType<typeof drizzle>;
    vi.spyOn(dbService, 'getDb').mockReturnValue(
      db as unknown as ReturnType<typeof dbService.getDb>,
    );

    // MIGRATION SAFETY TEST: Test fresh DB
    migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../../../../packages/database/drizzle'),
    });

    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
      name: string;
    }[];
    const newTables = tables.filter((t) => t.name.includes('__new_'));
    expect(newTables.length).toBe(0); // 1A. MIGRATION SAFETY: NO __new_ TABLES

    companyId = randomUUID();
    fyId = randomUUID();
    companyBId = randomUUID();

    db.insert(companies)
      .values([
        {
          id: companyId,
          legalName: 'E2E Testing Company',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: companyBId,
          legalName: 'Company B',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .run();

    db.insert(financial_years)
      .values({
        id: fyId,
        companyId,
        label: 'FY 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
      })
      .run();

    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      companyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    });
    vi.spyOn(documentNumberingService, 'generateNextNumberSync').mockResolvedValue('DOC-001');

    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(
        companyId,
        tx as import('../../src/repositories/BaseRepository').DbTransaction,
      );
      systemExpensePresetSeeder.seedExpensePresets(
        companyId,
        tx as import('../../src/repositories/BaseRepository').DbTransaction,
      );
    });

    hdfcBank = await paymentAccountService.create({
      accountType: 'BANK',
      displayName: 'HDFC Bank',
      accountNumber: '1111',
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

    supplierAId = randomUUID();
    db.insert(suppliers)
      .values({
        id: supplierAId,
        companyId,
        name: 'Test Supplier A',
        supplierCode: 'SUP-A',
        gstin: '07AAAAA0000A1Z5',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    supplierBId = randomUUID();
    db.insert(suppliers)
      .values({
        id: supplierBId,
        companyId,
        name: 'Test Supplier B',
        supplierCode: 'SUP-B',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    taxAId = randomUUID();
    db.insert(taxes)
      .values({
        id: taxAId,
        companyId,
        name: 'GST 18%',
        rate: 18,
        isActive: true,
        createdAt: new Date(),
      })
      .run();

    productAId = randomUUID();
    db.insert(products)
      .values({
        id: productAId,
        companyId,
        name: 'Test Product',
        sku: 'SKU-001',
        itemType: 'INVENTORY_ITEM',
        unitId: randomUUID(),
        taxId: taxAId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    const rentPreset = db
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.companyId, companyId), eq(expense_presets.name, 'Rent')))
      .get();
    rentPresetId = rentPreset!.id;

    const electricityPreset = db
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.companyId, companyId), eq(expense_presets.name, 'Electricity')))
      .get();
    electricityPresetId = electricityPreset!.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2. LEGACY PURCHASE REGRESSION', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'PURCHASE', // Explicit
      supplierId: supplierAId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 90,
      roundOffAmount: 90,
      grandTotal: 1180,
      notes: 'Test Notes',
      lines: [
        {
          productId: productAId,
          description: 'Line 1',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxId: taxAId,
          igstAmount: 0,
          cgstAmount: 90,
          sgstAmount: 90,
          cessAmount: 0,
          taxAmount: 180,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    expect(voucher).toBeDefined();

    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    // Assert debits and credits
    const totalDr = entries
      .filter((e) => e.debitAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    const totalCr = entries
      .filter((e) => e.creditAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    expect(totalDr).toBe(totalCr); // 12. BALANCE INVARIANT
    expect(totalDr).toBe(1180);

    const supplierApLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sundry Creditors')))
      .get();
    const crEntry = entries.find((e) => e.creditAmount > 0 && e.ledgerId === supplierApLedger!.id);
    expect(crEntry).toBeDefined();
    expect(crEntry!.creditAmount).toBe(1180);
  });

  it('2. LEGACY PURCHASE REGRESSION (Rejects Missing Product/Supplier)', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'PURCHASE',
      supplierId: supplierAId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 90,
      roundOffAmount: 90,
      grandTotal: 1180,
      lines: [
        {
          // productId missing
          description: 'Line 1',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      ],
    };

    await expect(purchaseService.create(input)).rejects.toThrow(
      'PURCHASE line requires a productId',
    );

    input.supplierId = undefined as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    input.lines[0].productId = productAId;
    await expect(purchaseService.create(input)).rejects.toThrow(
      'PURCHASE document requires a supplierId',
    );
  });

  it('3. EXPENSE MULTI-LINE', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierBId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 3000,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 3000,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
        {
          expensePresetId: electricityPresetId,
          description: 'Elec',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const items = db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, docId))
      .all();
    expect(items.length).toBe(2);
    expect(items[0].expenseLedgerId).toBeDefined(); // Snapshotted
    expect(items[1].expenseLedgerId).toBeDefined();

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    const rentLedger = db
      .select()
      .from(ledgers)
      .where(eq(ledgers.id, items.find((i) => i.itemName === 'Rent')!.expenseLedgerId!))
      .get();
    const rentDr = entries.find((e) => e.ledgerId === rentLedger!.id && e.debitAmount > 0);
    expect(rentDr!.debitAmount).toBe(1000);

    const elecLedger = db
      .select()
      .from(ledgers)
      .where(eq(ledgers.id, items.find((i) => i.itemName === 'Electricity')!.expenseLedgerId!))
      .get();
    const elecDr = entries.find((e) => e.ledgerId === elecLedger!.id && e.debitAmount > 0);
    expect(elecDr!.debitAmount).toBe(2000);

    const totalDr = entries
      .filter((e) => e.debitAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    const totalCr = entries
      .filter((e) => e.creditAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    expect(totalDr).toBe(3000);
    expect(totalDr).toBe(totalCr); // 12. BALANCE INVARIANT
  });

  it('4. EXPENSE — PAID NOW', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: undefined, // Explicitly undefined
      paymentAccountId: hdfcBank.id,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    const crEntry = entries.find((e) => e.creditAmount > 0);
    expect(crEntry!.ledgerId).toBe(hdfcBank.ledgerId); // Credit Bank
    expect(crEntry!.creditAmount).toBe(500);

    const supplierApLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sundry Creditors')))
      .get();
    const apCrEntry = entries.find((e) => e.ledgerId === supplierApLedger!.id);
    expect(apCrEntry).toBeUndefined(); // No AP
  });

  it('5. EXPENSE — PAY LATER', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierAId,
      paymentAccountId: undefined, // Explicitly undefined
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    const supplierApLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sundry Creditors')))
      .get();
    const apCrEntry = entries.find(
      (e) => e.ledgerId === supplierApLedger!.id && e.creditAmount > 0,
    );
    expect(apCrEntry).toBeDefined(); // AP Credited
    expect(apCrEntry!.creditAmount).toBe(500);
  });

  it('6. CRITICAL: SUPPLIER + PAID NOW', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierAId, // Present
      paymentAccountId: hdfcBank.id, // Present
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    // MUST CREDIT BANK
    const bankCr = entries.find((e) => e.ledgerId === hdfcBank.ledgerId && e.creditAmount > 0);
    expect(bankCr).toBeDefined();
    expect(bankCr!.creditAmount).toBe(500);

    // MUST NOT CREDIT SUPPLIER AP
    const supplierApLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sundry Creditors')))
      .get();
    const apCrEntry = entries.find((e) => e.ledgerId === supplierApLedger!.id);
    expect(apCrEntry).toBeUndefined(); // Critical Assertion
  });

  it('7. SERVER-SIDE PRESET TRUST', async () => {
    const maliciousLedgerId = hdfcBank.ledgerId; // Try to route expense directly to Bank Ledger

    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierAId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId,
          // Inject malicious ledger id (types normally prevent this, but an API client could send it)
          expenseLedgerId: maliciousLedgerId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      ],
    };

    const docId = await purchaseService.create(input);

    // Verify saved snapshot uses REAL preset ledger, not malicious one
    const items = db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, docId))
      .all();
    const rentPreset = db
      .select()
      .from(expense_presets)
      .where(eq(expense_presets.id, rentPresetId))
      .get();

    expect(items[0].expenseLedgerId).toBe(rentPreset!.ledgerId);
    expect(items[0].expenseLedgerId).not.toBe(maliciousLedgerId);
  });

  it('8. HISTORICAL IMMUTABILITY', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      paymentAccountId: hdfcBank.id,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    const docId1 = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId1);

    const oldRentPreset = db
      .select()
      .from(expense_presets)
      .where(eq(expense_presets.id, rentPresetId))
      .get();
    const oldLedgerId = oldRentPreset!.ledgerId;

    // Remap Preset to a different ledger
    db.update(expense_presets)
      .set({ ledgerId: sbiBank.ledgerId }) // Just mapping to a random different ledger for test
      .where(eq(expense_presets.id, rentPresetId))
      .run();

    // Create Expense #2
    const docId2 = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId2);

    // Assert Doc1 used Old Ledger
    const items1 = db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, docId1))
      .all();
    expect(items1[0].expenseLedgerId).toBe(oldLedgerId);

    const v1 = db.select().from(vouchers).where(eq(vouchers.referenceId, docId1)).get();
    const entries1 = db
      .select()
      .from(voucher_entries)
      .where(and(eq(voucher_entries.voucherId, v1!.id), eq(voucher_entries.ledgerId, oldLedgerId)))
      .all();
    expect(entries1.length).toBe(1);

    // Assert Doc2 used New Ledger
    const items2 = db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, docId2))
      .all();
    expect(items2[0].expenseLedgerId).toBe(sbiBank.ledgerId);
  });

  it('9. COMPANY ISOLATION', async () => {
    // Switch to Company B context
    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyBId);

    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierAId, // Created under Company A
      purchaseDate: new Date('2026-05-01'),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 500,
      lines: [
        {
          expensePresetId: rentPresetId, // Created under Company A
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxAmount: 0,
        },
      ],
    };

    // Should fail because Preset ID is scoped to Company A, but we are querying as Company B
    await expect(purchaseService.create(input)).rejects.toThrow(
      `Invalid expense preset ID: ${rentPresetId}`,
    );

    // Revert context
    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
  });

  it('10. OPENING BALANCE REGRESSION', async () => {
    // A. Explicit Opening Balance = 0 (Must Succeed)
    const docId0 = await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: hdfcBank.id,
      amount: 0,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    const v0 = db.select().from(vouchers).where(eq(vouchers.referenceId, docId0.voucherId)).get();
    expect(v0).toBeDefined(); // 0-balance voucher explicitly created
    const e0 = db.select().from(voucher_entries).where(eq(voucher_entries.voucherId, v0!.id)).all();
    expect(e0.length).toBeGreaterThan(0);
    expect(e0[0].debitAmount > 0 ? e0[0].debitAmount : e0[0].creditAmount).toBe(0);

    // C. Negative Opening Balance (Must Fail)
    await expect(
      paymentAccountOpeningBalanceService.createOpeningBalance({
        paymentAccountId: sbiBank.id,
        amount: -100,
        balanceType: 'Dr',
        voucherDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow(); // Rejects negative amount
  });

  it('11. GST REGRESSION', async () => {
    const input: CreatePurchaseInput = {
      financialYearId: fyId,
      isReverseCharge: false,
      documentType: 'EXPENSE',
      supplierId: supplierAId,
      purchaseDate: new Date('2026-05-01'),
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 90,
      roundOffAmount: 90,
      grandTotal: 1180,
      lines: [
        {
          expensePresetId: rentPresetId,
          description: 'Rent',
          quantity: 1,
          rate: 1000,
          taxableAmount: 1000,
          lineTotal: 1000,
          discountAmount: 0,
          taxId: taxAId,
          igstAmount: 0,
          cgstAmount: 90,
          sgstAmount: 90,
          cessAmount: 0,
          taxAmount: 180,
        },
      ],
    };

    const docId = await purchaseService.create(input);
    await purchaseService.submitPurchase(docId);

    const voucher = db.select().from(vouchers).where(eq(vouchers.referenceId, docId)).get();
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucher!.id))
      .all();

    // Verify GST debits
    const cgstLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Input CGST')))
      .get();
    const sgstLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Input SGST')))
      .get();

    const cgstDr = entries.find((e) => e.ledgerId === cgstLedger!.id && e.debitAmount > 0);
    expect(cgstDr).toBeDefined();
    expect(cgstDr!.debitAmount).toBe(90);

    const sgstDr = entries.find((e) => e.ledgerId === sgstLedger!.id && e.debitAmount > 0);
    expect(sgstDr).toBeDefined();
    expect(sgstDr!.debitAmount).toBe(90);

    const totalDr = entries
      .filter((e) => e.debitAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    const totalCr = entries
      .filter((e) => e.creditAmount > 0)
      .reduce((s, e) => s + (e.debitAmount > 0 ? e.debitAmount : e.creditAmount), 0);
    expect(totalDr).toBe(1180);
    expect(totalDr).toBe(totalCr); // 12. BALANCE INVARIANT
  });
});
