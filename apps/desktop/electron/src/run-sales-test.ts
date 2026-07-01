import { randomUUID } from 'crypto';
import * as fs from 'fs';

fs.writeFileSync('test-output-sales.txt', '');

const log = (...args: unknown[]) => {
  const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') + '\n';
  fs.appendFileSync('test-output-sales.txt', msg);
  // eslint-disable-next-line no-console
  console.log(...args); // keep console.log too
};

import {
  companies,
  financial_years,
  units,
  taxes,
  products,
  customers,
  company_settings,
  ledgers,
  ledger_groups,
  sales_invoices,
  stock_movements,
  inventory_balances,
  vouchers,
  voucher_entries,
  document_sequences,
} from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { companyContextService } from './services/CompanyContextService';
import { dbService } from './services/database/DatabaseService';
import { systemLedgerSeeder } from './services/database/SystemLedgerSeeder';
import { financialYearContextService } from './services/FinancialYearContextService';
import { inventoryEngine } from './services/InventoryEngine';
import { salesInvoiceService } from './services/SalesInvoiceService';

export async function runTest() {
  log('Starting Sales Runtime Test');

  await dbService.init();
  const db = dbService.getDb();

  // 1. Setup Company
  let activeCompany = db.select().from(companies).limit(1).get();
  if (!activeCompany) {
    const id = randomUUID();
    db.insert(companies)
      .values({
        id,
        legalName: 'Runtime Test Company',
        pan: 'ABCDE1234F',
        stateCode: '27',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
    db.insert(company_settings)
      .values({ id: randomUUID(), companyId: id, createdAt: new Date(), updatedAt: new Date() })
      .run();
    activeCompany = db.select().from(companies).where(eq(companies.id, id)).get();
  }

  if (!activeCompany) throw new Error('Missing company');

  // Ensure settings exist
  const hasSettings = db
    .select()
    .from(company_settings)
    .where(eq(company_settings.companyId, activeCompany.id))
    .get();
  if (!hasSettings) {
    db.insert(company_settings)
      .values({
        id: randomUUID(),
        companyId: activeCompany.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
  }
  // Inject company context directly (avoids async DB side-effects)
  (companyContextService as unknown as { activeCompanyId: string }).activeCompanyId =
    activeCompany.id;

  // Ensure system ledgers exist for the test company
  try {
    systemLedgerSeeder.seedSystemLedgers(activeCompany.id, db as never);
  } catch (e) {
    log('System ledgers might already exist or errored:', e);
  }

  // 2. Setup FY
  let activeFy = db
    .select()
    .from(financial_years)
    .where(eq(financial_years.companyId, activeCompany.id))
    .limit(1)
    .get();
  if (!activeFy) {
    const fyid = randomUUID();
    db.insert(financial_years)
      .values({
        id: fyid,
        companyId: activeCompany.id,
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

  // Inject FY context directly (avoids async DB side-effects)
  (financialYearContextService as unknown as { activeFinancialYear: unknown }).activeFinancialYear =
    activeFy;

  const companyId = activeCompany.id;
  const financialYearId = activeFy.id;

  // 3. Create Runtime Customer
  const customerId = randomUUID();
  const timestampSuffix = Date.now();
  db.insert(customers)
    .values({
      id: customerId,
      companyId,
      name: 'Runtime Sales Customer ' + timestampSuffix,
      customerCode: 'CUS-RUN-' + timestampSuffix,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    })
    .run();

  let debtorsGroup = db
    .select()
    .from(ledger_groups)
    .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Sundry Debtors')))
    .get();

  if (!debtorsGroup) {
    const defaultParent = db
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.companyId, companyId))
      .limit(1)
      .get();
    const grpId = randomUUID();
    db.insert(ledger_groups)
      .values({
        id: grpId,
        companyId,
        name: 'Sundry Debtors',
        nature: 'Asset',
        isSystemGroup: true,
        parentGroupId: defaultParent ? defaultParent.id : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncVersion: 1,
      })
      .run();
    debtorsGroup = db.select().from(ledger_groups).where(eq(ledger_groups.id, grpId)).get();
  }

  if (!debtorsGroup) throw new Error('Failed to create or find Sundry Debtors');

  db.insert(ledgers)
    .values({
      id: randomUUID(),
      companyId,
      name: 'Runtime Sales Customer ' + timestampSuffix,
      isSystemAccount: false,
      referenceId: customerId,
      referenceType: 'CUSTOMER',
      groupId: debtorsGroup!.id,
      openingBalance: 0,
      openingType: 'Dr',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    })
    .run();
  log('Customer created:', customerId);

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
      name: 'Runtime Sales Product',
      sku: 'SKU-RUN-SALES-' + Date.now(),
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

  // 4.5. ADD INVENTORY
  // Simulate an inbound purchase manually or via InventoryEngine
  db.transaction((tx) => {
    inventoryEngine.postInboundSync(
      {
        companyId,
        financialYearId,
        productId,
        movementType: 'OPENING_BALANCE',
        referenceType: 'MANUAL',
        referenceId: randomUUID(),
        quantityIn: 50,
        quantityOut: 0,
        rate: 100, // WAC = 100
        movementDate: new Date(),
        remarks: 'Initial stock for sales test',
      },
      tx,
    );
  });

  const initialBalance = db
    .select()
    .from(inventory_balances)
    .where(eq(inventory_balances.productId, productId))
    .get();
  log(
    'Initial Inventory Balance Qty:',
    initialBalance?.currentQty,
    'WAC:',
    initialBalance?.currentWacPaise,
  );

  // 5. Create DRAFT Sales Invoice
  log('\n--- B. Draft Sales Test ---');
  let invoiceId: string;
  try {
    const res = await salesInvoiceService.createInvoice({
      companyId,
      financialYearId,
      customerId,
      invoiceNumber: 'INV-' + Date.now(),
      invoiceDate: new Date(),
      isReverseCharge: false,
      subtotal: 1500, // 10 * 150
      taxAmount: 75,
      discountAmount: 0,
      roundOffAmount: 0,
      grandTotal: 1575,
      status: 'DRAFT',
      items: [
        {
          productId,
          unitId: unit!.id,
          taxId: tax!.id,
          quantity: 10,
          rate: 150,
          discountAmount: 0,
          taxableAmount: 1500,
          taxAmount: 75,
          lineTotal: 1575,
        },
      ],
    });
    invoiceId = res.invoiceId;
    log('Sales Invoice created in DRAFT successfully:', invoiceId);
  } catch (e) {
    log('Failed to create sales invoice:', e);
    throw e;
  }

  // Verify DB state for Draft
  const draftRow = db.select().from(sales_invoices).where(eq(sales_invoices.id, invoiceId)).get();
  log('Draft Row:', draftRow ? 'Exists' : 'Missing', draftRow?.status);

  const draftMovements = db
    .select()
    .from(stock_movements)
    .where(
      and(
        eq(stock_movements.referenceId, invoiceId),
        eq(stock_movements.referenceType, 'SALES_INVOICE'),
      ),
    )
    .all();
  log('Draft Movements:', draftMovements.length);

  const draftVouchers = db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.referenceId, invoiceId), eq(vouchers.referenceType, 'SALES_INVOICE')))
    .all();
  log('Draft Vouchers:', draftVouchers.length);

  // 6. SUBMIT Sales Invoice
  log('\n--- C. Submit Sales Test ---');
  try {
    await salesInvoiceService.submitInvoice(invoiceId);
    log('Sales Invoice SUBMITTED successfully');
  } catch (e) {
    log('Failed to submit sales invoice:', e instanceof Error ? e.stack : e);
    throw e;
  }

  // Verify DB state for Submit
  const submittedRow = db
    .select()
    .from(sales_invoices)
    .where(eq(sales_invoices.id, invoiceId))
    .get();
  log('Submitted Row Status:', submittedRow?.status);

  const submitMovements = db
    .select()
    .from(stock_movements)
    .where(
      and(
        eq(stock_movements.referenceId, invoiceId),
        eq(stock_movements.referenceType, 'SALES_INVOICE'),
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
    .where(and(eq(vouchers.referenceId, invoiceId), eq(vouchers.referenceType, 'SALES_INVOICE')))
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
      if (e.narration?.includes('COGS')) {
        log('  Found COGS Entry:', e.debitAmount, e.creditAmount);
      }
      if (e.narration?.includes('Inventory asset reduction')) {
        log('  Found Inventory Reduction Entry:', e.debitAmount, e.creditAmount);
      }
    });
    log(
      'Voucher Debits:',
      d,
      'Credits:',
      c,
      Math.abs(d - c) < 0.001 ? '(BALANCED)' : '(UNBALANCED)',
    );
  }

  // 7. CANCEL Sales Invoice
  // Log all vouchers and sequences to debug UNIQUE constraint
  log('--- DEBUG VOUCHERS AND SEQUENCES ---');
  const allVouchers = db.select().from(vouchers).all();
  log(
    'Vouchers:',
    JSON.stringify(
      allVouchers.map((v) => ({
        id: v.id,
        number: v.voucherNumber,
        type: v.voucherType,
        ref: v.referenceType,
      })),
      null,
      2,
    ),
  );

  const allSeqs = db.select().from(document_sequences).all();
  log(
    'Sequences:',
    JSON.stringify(
      allSeqs.map((s) => ({
        type: s.documentType,
        val: s.currentValue,
        cId: s.companyId,
        fyId: s.financialYearId,
      })),
      null,
      2,
    ),
  );
  log('EXPECTED FY:', activeFy.id);
  log('EXPECTED COMPANY:', activeCompany.id);

  log('\n--- E. Cancel Sales Test ---');
  try {
    await salesInvoiceService.cancelInvoice(invoiceId);
    log('Sales Invoice CANCELLED successfully');
  } catch (e) {
    log('Failed to cancel sales invoice:', e instanceof Error ? e.stack : e);
    throw e;
  }

  // Verify DB state for Cancel
  const cancelledRow = db
    .select()
    .from(sales_invoices)
    .where(eq(sales_invoices.id, invoiceId))
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
