import { randomUUID } from 'crypto';
import * as fs from 'fs';

fs.writeFileSync('test-output.txt', '');

const log = (...args: unknown[]) => {
  const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  fs.appendFileSync('test-output.txt', msg);
  // eslint-disable-next-line no-console
  console.log(...args); // keep console.log too
};

import {
  companies,
  financial_years,
  units,
  taxes,
  products,
  suppliers,
  company_settings,
  ledgers,
  ledger_groups,
  purchase_invoices,
  stock_movements,
  inventory_balances,
  vouchers,
  voucher_entries,
} from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { companyContextService } from '../electron/src/services/CompanyContextService';
import { dbService } from '../electron/src/services/database/DatabaseService';
import { systemLedgerSeeder } from '../electron/src/services/database/SystemLedgerSeeder';
import { financialYearContextService } from '../electron/src/services/FinancialYearContextService';
import { purchaseService } from '../electron/src/services/PurchaseService';

async function runTest() {
  log('--- STARTING PURCHASE RUNTIME CERTIFICATION ---');

  // 1. Initialize DB
  await dbService.init();
  const db = dbService.getDb();

  // 2. Fetch or Create Active Company and FY
  let activeCompany = db.select().from(companies).limit(1).get();
  if (!activeCompany) {
    const cid = randomUUID();
    db.insert(companies)
      .values({
        id: cid,
        legalName: 'Test Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
    activeCompany = db.select().from(companies).where(eq(companies.id, cid)).get();
  }
  // Bypass async setup repo bugs
  (companyContextService as unknown as { activeCompanyId: string }).activeCompanyId =
    activeCompany!.id;

  const settings = db
    .select()
    .from(company_settings)
    .where(eq(company_settings.companyId, activeCompany!.id))
    .get();
  if (!settings) {
    db.insert(company_settings)
      .values({
        id: randomUUID(),
        companyId: activeCompany!.id,
        purchasePrefix: 'PUR',
        salesPrefix: 'INV',
        isGstRegistered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
  }

  // Ensure system ledgers exist
  try {
    systemLedgerSeeder.seedSystemLedgers(activeCompany!.id, db as never);
  } catch (e) {
    log('System ledgers might already exist or errored:', e);
  }

  let activeFy = db
    .select()
    .from(financial_years)
    .where(eq(financial_years.companyId, activeCompany!.id))
    .limit(1)
    .get();
  if (!activeFy) {
    const fyid = randomUUID();
    db.insert(financial_years)
      .values({
        id: fyid,
        companyId: activeCompany!.id,
        label: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isActive: true,
      })
      .run();
    activeFy = db.select().from(financial_years).where(eq(financial_years.id, fyid)).get();
  }

  if (!activeCompany) throw new Error('Missing company');
  if (!activeFy) throw new Error('Missing financial year');

  // Bypass repository async transaction during setup
  (financialYearContextService as unknown as { activeFinancialYear: unknown }).activeFinancialYear =
    activeFy;

  const companyId = activeCompany.id;
  const financialYearId = activeFy.id;

  // 3. Create Runtime Supplier
  const supplierId = randomUUID();
  const timestampSuffix = Date.now();
  db.insert(suppliers)
    .values({
      id: supplierId,
      companyId,
      name: 'Runtime Purchase Supplier ' + timestampSuffix,
      supplierCode: 'SUP-RUN-' + timestampSuffix,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    })
    .run();

  const creditorsGroup = db
    .select()
    .from(ledger_groups)
    .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Sundry Creditors')))
    .get();

  db.insert(ledgers)
    .values({
      id: randomUUID(),
      companyId,
      name: 'Runtime Purchase Supplier ' + timestampSuffix,
      isSystemAccount: false,
      referenceId: supplierId,
      referenceType: 'SUPPLIER',
      groupId: creditorsGroup!.id,
      openingBalance: 0,
      openingType: 'Cr',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    })
    .run();
  log('Supplier created:', supplierId);

  let unit = db.select().from(units).where(eq(units.companyId, companyId)).get();
  if (!unit) {
    db.insert(units)
      .values({
        id: randomUUID(),
        companyId,
        name: 'Pieces',
        shortName: 'PCS',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncVersion: 1,
      })
      .run();
    unit = db.select().from(units).where(eq(units.companyId, companyId)).get();
  }

  let tax = db.select().from(taxes).where(eq(taxes.companyId, companyId)).get();
  if (!tax) {
    db.insert(taxes)
      .values({
        id: randomUUID(),
        companyId,
        name: 'GST 5%',
        rate: 5,
        taxType: 'GST',
        isActive: true,
        createdAt: new Date(),
      })
      .run();
    tax = db.select().from(taxes).where(eq(taxes.companyId, companyId)).get();
  }

  // 4. Create Runtime Product
  const productId = randomUUID();
  db.insert(products)
    .values({
      id: productId,
      companyId,
      name: 'Runtime Purchase Product',
      sku: 'SKU-RUN-' + Date.now(),
      itemType: 'INVENTORY_ITEM',
      unitId: unit!.id,
      taxId: tax!.id,
      purchasePrice: 100,
      salePrice: 150,
      isActive: true,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
  log('Product created:', productId);

  // 5. Create DRAFT Purchase
  log('\n--- B. Draft Purchase Test ---');
  let purchaseId: string;
  try {
    purchaseId = await purchaseService.create({
      financialYearId,
      supplierId,
      isReverseCharge: false,
      purchaseDate: new Date(),
      subtotal: 100,
      taxAmount: 5,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 105,
      status: 'DRAFT',
      lines: [
        {
          productId,
          unitId: unit!.id,
          taxId: tax!.id,
          quantity: 10,
          rate: 10,
          discountAmount: 0,
          taxableAmount: 100,
          taxAmount: 5,
          lineTotal: 105,
        },
      ],
    });
    log('Purchase created in DRAFT successfully:', purchaseId);
  } catch (e) {
    log('Failed to create purchase:', e);
    throw e;
  }

  // Verify DB state for Draft
  const draftRow = db
    .select()
    .from(purchase_invoices)
    .where(eq(purchase_invoices.id, purchaseId))
    .get();
  log('Draft Row:', draftRow ? 'Exists' : 'Missing', draftRow?.status);

  const draftMovements = db
    .select()
    .from(stock_movements)
    .where(
      and(
        eq(stock_movements.referenceId, purchaseId),
        eq(stock_movements.referenceType, 'PURCHASE_BILL'),
      ),
    )
    .all();
  log('Draft Movements:', draftMovements.length);

  const draftVouchers = db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.referenceId, purchaseId), eq(vouchers.referenceType, 'PURCHASE_BILL')))
    .all();
  log('Draft Vouchers:', draftVouchers.length);

  // 6. SUBMIT Purchase
  log('\n--- C. Submit Purchase Test ---');
  try {
    await purchaseService.submitPurchase(purchaseId);
    log('Purchase SUBMITTED successfully');
  } catch (e) {
    log('Failed to submit purchase:', e);
    throw e;
  }

  // Verify DB state for Submit
  const submittedRow = db
    .select()
    .from(purchase_invoices)
    .where(eq(purchase_invoices.id, purchaseId))
    .get();
  log('Submitted Row Status:', submittedRow?.status);

  const submitMovements = db
    .select()
    .from(stock_movements)
    .where(
      and(
        eq(stock_movements.referenceId, purchaseId),
        eq(stock_movements.referenceType, 'PURCHASE_BILL'),
      ),
    )
    .all();
  log('Submitted Movements:', submitMovements.length);

  const submitBalances = db
    .select()
    .from(inventory_balances)
    .where(eq(inventory_balances.productId, productId))
    .all();
  log(
    'Inventory Balance Qty:',
    submitBalances[0]?.currentQty,
    'WAC:',
    submitBalances[0]?.currentWacPaise,
  );

  const submitVouchers = db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.referenceId, purchaseId), eq(vouchers.referenceType, 'PURCHASE_BILL')))
    .all();
  log('Submitted Vouchers:', submitVouchers.length, 'Voucher ID:', submitVouchers[0]?.id);

  if (submitVouchers.length > 0) {
    const entries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, submitVouchers[0].id))
      .all();
    let d = 0,
      c = 0;
    entries.forEach((e) => {
      d += e.debitAmount;
      c += e.creditAmount;
    });
    log(
      'Voucher Debits:',
      d,
      'Credits:',
      c,
      Math.abs(d - c) < 0.001 ? '(BALANCED)' : '(UNBALANCED)',
    );
  }

  // 7. CANCEL Purchase
  log('\n--- E. Cancel Purchase Test ---');
  try {
    await purchaseService.cancelPurchase(purchaseId);
    log('Purchase CANCELLED successfully');
  } catch (e) {
    log('Failed to cancel purchase:', e);
    throw e;
  }

  // Verify DB state for Cancel
  const cancelledRow = db
    .select()
    .from(purchase_invoices)
    .where(eq(purchase_invoices.id, purchaseId))
    .get();
  log('Cancelled Row Status:', cancelledRow?.status);

  const cancelBalances = db
    .select()
    .from(inventory_balances)
    .where(eq(inventory_balances.productId, productId))
    .all();
  log(
    'Cancelled Balance Qty:',
    cancelBalances[0]?.currentQty,
    'WAC:',
    cancelBalances[0]?.currentWacPaise,
  );

  const reversalVoucherId = submitVouchers[0]?.id
    ? db.select().from(vouchers).where(eq(vouchers.id, submitVouchers[0].id)).get()
        ?.reversalVoucherId
    : null;
  log('Reversal Voucher ID:', reversalVoucherId);

  if (reversalVoucherId) {
    const revEntries = db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, reversalVoucherId))
      .all();
    let d = 0,
      c = 0;
    revEntries.forEach((e) => {
      d += e.debitAmount;
      c += e.creditAmount;
    });
    log(
      'Reversal Debits:',
      d,
      'Credits:',
      c,
      Math.abs(d - c) < 0.001 ? '(BALANCED)' : '(UNBALANCED)',
    );
  }

  log('\n--- TEST COMPLETE ---');
  process.exit(0);
}

runTest().catch((e) => {
  log('Test failed with error:', e);
  process.exit(1);
});
