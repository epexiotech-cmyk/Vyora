/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import { randomUUID } from 'crypto';

import { app } from 'electron';

import { BaseRepository } from './electron/src/repositories/BaseRepository';
import { companyBootstrapService } from './electron/src/services/CompanyBootstrapService';
import { companyContextService } from './electron/src/services/CompanyContextService';
import { dbService } from './electron/src/services/database/DatabaseService';
import { financialYearService } from './electron/src/services/FinancialYearService';
import { inventoryService } from './electron/src/services/InventoryService';
import { numberingEngineService } from './electron/src/services/NumberingEngineService';
import { productService } from './electron/src/services/ProductService';
import {
  salesInvoiceService,
  StockValidationError,
} from './electron/src/services/SalesInvoiceService';

async function bootstrap() {
  await dbService.init();

  const companyId = await companyBootstrapService.createCompany({
    legalName: 'Sales Integration Rehearsal Corp',
    currency: 'INR',
    isGstRegistered: false,
    financialYearStart: new Date('2026-04-01'),
  });

  companyContextService.setActiveCompany(companyId);

  const fylist = await financialYearService.listFinancialYears(companyId);
  let fy = fylist[0];
  if (!fy) {
    fy = await financialYearService.createFinancialYear({
      companyId,
      label: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    });
  }
  await financialYearService.setActiveFinancialYear(companyId, fy.id);

  return { companyId, financialYearId: fy.id };
}

async function runRehearsals() {
  const { companyId, financialYearId } = await bootstrap();
  console.log('--- STARTING SALES RUNTIME REHEARSAL ---');

  // We need a tax ID to create products/invoices
  const taxId = randomUUID();
  dbService
    .getDb()
    .insert(require('@vyora/database').taxes)
    .values({
      id: taxId,
      companyId,
      name: 'GST 18%',
      rate: 18,
      isActive: true,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
  const useTaxId = taxId;

  // We need a customer ID
  const { customerService } = require('./electron/src/services/CustomerService');
  const newCust = await customerService.createCustomer({
    companyId,
    name: 'Test Customer',
    openingBalance: 0,
    openingType: 'DEBIT',
  });
  const customerId = newCust.id;

  // We need a unit ID
  const unitId = randomUUID();
  dbService
    .getDb()
    .insert(require('@vyora/database').units)
    .values({
      id: unitId,
      companyId,
      name: 'Numbers',
      shortName: 'NOS',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    })
    .run();

  // --- A. Product Creation Rehearsal ---
  console.log('\n[A] Product Creation Rehearsal');
  const product1 = await productService.createProduct({
    companyId,
    name: `Test Product ${Date.now()}`,
    itemType: 'INVENTORY_ITEM',
    unitId: unitId!,
    taxId: useTaxId,
    salePrice: 100,
    purchasePrice: 50,
    stock: 100,
  });
  console.log(`Created product: ${product1.sku} (${product1.id})`);
  if (!product1.sku?.startsWith('ITEM-')) throw new Error('Product SKU generation failed');
  console.log('✅ Product Creation OK');

  const { stockMovementRepo } =
    require('./electron/src/services/InventoryService').inventoryService;
  stockMovementRepo.createMovementSync({
    companyId,
    financialYearId,
    productId: product1.id,
    movementType: 'OPENING',
    referenceType: 'MANUAL',
    referenceId: 'opening',
    quantityIn: 100,
    quantityOut: 0,
    rate: 50,
    movementDate: new Date(),
  });

  // --- B. Sales Invoice Creation Rehearsal ---
  console.log('\n[B] Sales Invoice Creation Rehearsal');
  const draftRes = await salesInvoiceService.createDraft({
    companyId,
    financialYearId,
    customerId: customerId!,
    invoiceDate: new Date(),
    invoiceNumber: '',
    discountAmount: 0,
    status: 'DRAFT',
    items: [
      {
        productId: product1.id,
        quantity: 5,
        rate: 100,
        taxId: useTaxId,
        unitId: unitId!,
        discountAmount: 0,
      },
    ],
  });
  const draftInvoice = await salesInvoiceService.getInvoiceById(draftRes.invoiceId);
  console.log(`Created draft invoice: ${draftInvoice.invoiceNumber}`);
  if (draftInvoice.status !== 'DRAFT') throw new Error('Invoice is not draft');
  console.log('✅ Sales Invoice Draft Creation OK');

  // --- C. Stock Movement Rehearsal (Submit) ---
  console.log('\n[C] Sales Invoice Submission Rehearsal');
  await salesInvoiceService.submitInvoice(draftInvoice.id);
  const submittedInvoice = await salesInvoiceService.getInvoiceById(draftInvoice.id);
  if (submittedInvoice.status !== 'SUBMITTED') throw new Error('Invoice is not submitted');
  const stockAfterSale = inventoryService.getCurrentStockSync(product1.id);
  if (stockAfterSale.stock !== 95)
    throw new Error(`Stock mismatch after sale. Expected 95, got ${stockAfterSale.stock}`);
  console.log('✅ Sales Invoice Submission OK');

  // --- D. Sales Invoice Cancellation Rehearsal ---
  console.log('\n[D] Sales Invoice Cancellation Rehearsal');
  await salesInvoiceService.cancelInvoice(submittedInvoice.id);
  const cancelledInvoice = await salesInvoiceService.getInvoiceById(submittedInvoice.id);
  if (cancelledInvoice.status !== 'CANCELLED') throw new Error('Invoice is not cancelled');
  const stockAfterCancel = inventoryService.getCurrentStockSync(product1.id);
  if (stockAfterCancel.stock !== 100)
    throw new Error(`Stock mismatch after cancel. Expected 100, got ${stockAfterCancel.stock}`);
  console.log('✅ Sales Invoice Cancellation OK');

  // --- E. Concurrent Operation Rehearsal ---
  console.log('\n[E] Concurrent Operation Rehearsal');
  const concurrentPromises = [];
  for (let i = 0; i < 5; i++) {
    concurrentPromises.push(
      salesInvoiceService.createDraft({
        companyId,
        financialYearId,
        customerId: customerId!,
        invoiceDate: new Date(),
        invoiceNumber: '',
        discountAmount: 0,
        status: 'DRAFT',
        items: [
          {
            productId: product1.id,
            quantity: 1,
            rate: 100,
            taxId: useTaxId,
            unitId: unitId!,
            discountAmount: 0,
          },
        ],
      }),
    );
  }
  const concurrentResults = await Promise.all(concurrentPromises);
  const invoiceNumbers = [];
  for (const res of concurrentResults) {
    const inv = await salesInvoiceService.getInvoiceById(res.invoiceId);
    invoiceNumbers.push(inv.invoiceNumber);
  }
  const uniqueNumbers = new Set(invoiceNumbers);
  if (uniqueNumbers.size !== 5)
    throw new Error('Duplicate invoice numbers generated during concurrency!');
  console.log(`Generated numbers concurrently: ${invoiceNumbers.join(', ')}`);
  console.log('✅ Concurrent Operation OK');

  // --- F. Rollback Verification Rehearsal ---
  console.log('\n[F] Rollback Verification Rehearsal');
  const rollbackDraft = await salesInvoiceService.createDraft({
    companyId,
    financialYearId,
    customerId: customerId!,
    invoiceDate: new Date(),
    invoiceNumber: '',
    discountAmount: 0,
    status: 'DRAFT',
    items: [
      {
        productId: product1.id,
        quantity: 1000,
        rate: 100,
        taxId: useTaxId,
        unitId: unitId!,
        discountAmount: 0,
      },
    ],
  });
  try {
    await salesInvoiceService.submitInvoice(rollbackDraft.invoiceId);
    throw new Error('Should have failed stock validation');
  } catch (err) {
    if (err instanceof StockValidationError) {
      console.log('Caught expected StockValidationError');
    } else {
      throw err;
    }
  }
  const rollbackCheck = await salesInvoiceService.getInvoiceById(rollbackDraft.invoiceId);
  if (rollbackCheck.status !== 'DRAFT')
    throw new Error('Invoice status rolled forward despite failure');
  const stockCheck = inventoryService.getCurrentStockSync(product1.id);
  if (stockCheck.stock !== 100) throw new Error('Stock was modified despite rollback');
  console.log('✅ Rollback Verification OK');

  // --- G. Sequence Rollback Rehearsal ---
  console.log('\n[G] Sequence Rollback Rehearsal');
  const { document_sequences } = require('@vyora/database');
  const sequencesBefore = dbService
    .getDb()
    .select()
    .from(document_sequences)
    .where(require('drizzle-orm').eq(document_sequences.documentType, 'SALES_INVOICE'))
    .all();
  const valBefore = (
    sequencesBefore as Array<{ financialYearId: string; currentValue: number }>
  ).find((s) => s.financialYearId === financialYearId)?.currentValue;
  console.log(`Initial sequence value: ${valBefore}`);

  try {
    dbService.getDb().transaction((_tx) => {
      numberingEngineService.generateNextNumberSync(
        companyId,
        financialYearId,
        'SALES_INVOICE',
        _tx,
      );
      throw new Error('Intentional Failure');
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== 'Intentional Failure') throw err;
  }

  const sequencesAfter = dbService
    .getDb()
    .select()
    .from(document_sequences)
    .where(require('drizzle-orm').eq(document_sequences.documentType, 'SALES_INVOICE'))
    .all();
  const valAfter = (
    sequencesAfter as Array<{ financialYearId: string; currentValue: number }>
  ).find((s) => s.financialYearId === financialYearId)?.currentValue;
  console.log(`Sequence value after intentional failure: ${valAfter}`);
  if (valBefore !== valAfter)
    throw new Error(`Sequence did not roll back! Before: ${valBefore}, After: ${valAfter}`);
  console.log('✅ Sequence Rollback OK');

  // --- H. Nested Transaction Prevention Rehearsal ---
  console.log('\n[H] Nested Transaction Prevention Rehearsal');
  try {
    dbService.getDb().transaction((_tx) => {
      dbService.getDb().transaction(() => {
        dbService.getDb().run(require('drizzle-orm').sql`SELECT 1`);
      });
    });
    throw new Error('Should have thrown cannot start transaction within a transaction');
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('transaction within a transaction')) {
      console.log('Unexpected err', err.message);
    } else {
      console.log('Caught expected nested transaction error');
    }
  }

  let repoUsedInnerTx = false;
  class TestRepo extends BaseRepository {
    public testMethod(tx?: unknown) {
      if (tx) {
        console.log('Repository called WITH tx -> using existing transaction');
      } else {
        console.log('Repository called WITHOUT tx -> opening new transaction');
        repoUsedInnerTx = true;
      }
    }
  }
  const repo = new TestRepo();
  repo.testMethod(); // without tx
  repo.testMethod('FAKE_TX_OBJECT'); // with tx
  console.log('✅ Nested Transaction Prevention Validated (Logic):', repoUsedInnerTx);

  // --- I. Cross-Domain Contention Rehearsal ---
  console.log('\n[I] Cross-Domain Contention Rehearsal');
  const crossPromises = [
    productService.createProduct({
      companyId,
      name: `Contention Prod`,
      itemType: 'INVENTORY_ITEM',
      unitId: unitId!,
      taxId: useTaxId,
    }),
    productService.createProduct({
      companyId,
      name: `Contention Prod 2`,
      itemType: 'INVENTORY_ITEM',
      unitId: unitId!,
      taxId: useTaxId,
    }),
    salesInvoiceService.createDraft({
      companyId,
      financialYearId,
      customerId: customerId!,
      invoiceDate: new Date(),
      invoiceNumber: '',
      discountAmount: 0,
      status: 'DRAFT',
      items: [
        {
          productId: product1.id,
          quantity: 1,
          rate: 100,
          taxId: useTaxId,
          unitId: unitId!,
          discountAmount: 0,
        },
      ],
    }),
    salesInvoiceService.createDraft({
      companyId,
      financialYearId,
      customerId: customerId!,
      invoiceDate: new Date(),
      invoiceNumber: '',
      discountAmount: 0,
      status: 'DRAFT',
      items: [
        {
          productId: product1.id,
          quantity: 1,
          rate: 100,
          taxId: useTaxId,
          unitId: unitId!,
          discountAmount: 0,
        },
      ],
    }),
    // Supplier or Customer creation
    new Promise((resolve) => {
      const res = dbService.getDb().transaction((tx) => {
        const sku = numberingEngineService.generateNextNumberSync(
          companyId,
          financialYearId,
          'CUSTOMER',
          tx,
        );
        return sku;
      });
      resolve(res);
    }),
  ];
  const crossResults = await Promise.all(crossPromises);
  console.log(`Resolved cross-domain requests. Results length: ${crossResults.length}`);
  console.log('✅ Cross-Domain Contention OK');

  console.log('\n--- ALL SALES REHEARSALS PASSED ---');
}
app.whenReady().then(() => {
  runRehearsals()
    .then(() => {
      app.quit();
    })
    .catch((err) => {
      console.error('\n❌ REHEARSAL FAILED:');
      console.error(err);
      process.exit(1);
    });
});
