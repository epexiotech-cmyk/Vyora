/* eslint-disable no-console */
import * as fs from 'fs';

import { ledgers } from '@vyora/database';
import { eq, and } from 'drizzle-orm';
import { app } from 'electron';

import { companyBootstrapService } from './electron/src/services/CompanyBootstrapService';
import { companyContextService } from './electron/src/services/CompanyContextService';
import { customerService } from './electron/src/services/CustomerService';
import { dbService } from './electron/src/services/database/DatabaseService';
import { supplierService } from './electron/src/services/SupplierService';

app.whenReady().then(async () => {
  const log: string[] = [];
  const logMsg = (msg: string) => {
    console.log(msg);
    log.push(msg);
  };

  try {
    logMsg('--- Phase 7.1.3C Runtime Rehearsal ---');
    await dbService.init();
    const db = dbService.getDb();

    // 1. Create a disposable rehearsal company
    logMsg('Creating disposable rehearsal company...');
    const companyId = await companyBootstrapService.createCompany({
      legalName: 'Integration Rehearsal Corp',
      tradeName: 'IRC',
      businessType: 'Others',
      registrationType: 'Unregistered',
      addressLine1: '123 Rehearsal St',
      state: '24', // Gujarat
      pincode: '380001',
      city: 'Ahmedabad',
      booksBeginDate: new Date('2026-04-01'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    logMsg(`Company created: ${companyId}`);

    // Set context
    await companyContextService.setActiveCompany(companyId);

    // 2. Create Customer
    logMsg('\nCreating Customer...');
    const cust = await customerService.createCustomer({
      name: 'Acme Corp',
      contactPerson: 'Wile E. Coyote',
      mobile: '9999999999',
      addressLine1: 'Desert Road 1',
      state: '24',
      pincode: '380001',
      city: 'Ahmedabad',
      registrationType: 'Unregistered',
      openingBalance: 500000,
      openingType: 'Dr',
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
    });
    logMsg(`Customer created: ${cust.customerCode} - ${cust.name} (${cust.id})`);

    // Verify Ledger Creation
    const custLedger = db
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, companyId),
          eq(ledgers.referenceType, 'CUSTOMER'),
          eq(ledgers.referenceId, cust.id),
        ),
      )
      .get();

    if (!custLedger) throw new Error('Customer Ledger was not created!');
    logMsg(`✅ Customer Ledger created successfully: ${custLedger.name}`);
    logMsg(`   Opening Balance: ${custLedger.openingBalance} ${custLedger.openingType}`);
    if (custLedger.name !== `${cust.name} (${cust.customerCode})`) {
      throw new Error(
        `Customer ledger name mismatch! Expected: ${cust.name} (${cust.customerCode}), Got: ${custLedger.name}`,
      );
    }

    // 3. Create Supplier
    logMsg('\nCreating Supplier...');
    const supp = await supplierService.createSupplier({
      name: 'Global Tech',
      contactPerson: 'CEO',
      mobile: '9876543210',
      addressLine1: 'Tech Park',
      state: '24',
      pincode: '380001',
      city: 'Ahmedabad',
      registrationType: 'Unregistered',
      openingBalance: 1200000,
      openingType: 'Cr',
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
    });
    logMsg(`Supplier created: ${supp.supplierCode} - ${supp.name} (${supp.id})`);

    const suppLedger = db
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, companyId),
          eq(ledgers.referenceType, 'SUPPLIER'),
          eq(ledgers.referenceId, supp.id),
        ),
      )
      .get();

    if (!suppLedger) throw new Error('Supplier Ledger was not created!');
    logMsg(`✅ Supplier Ledger created successfully: ${suppLedger.name}`);
    logMsg(`   Opening Balance: ${suppLedger.openingBalance} ${suppLedger.openingType}`);

    // 4. Update Customer Name and Sync Check
    logMsg('\nUpdating Customer Name...');
    await customerService.updateCustomer(cust.id, { name: 'Acme Corporation Inc.' });

    const updatedCustLedger = db.select().from(ledgers).where(eq(ledgers.id, custLedger.id)).get();
    if (updatedCustLedger!.name !== custLedger.name) {
      throw new Error('Ledger name was improperly updated! Option B violated.');
    }
    logMsg(`✅ Option B Respected: Ledger name remained stable after CRM name change.`);

    // 5. Deactivate Supplier
    logMsg('\nDeactivating Supplier...');
    await supplierService.deactivateSupplier(supp.id);

    const deactivatedSuppLedger = db
      .select()
      .from(ledgers)
      .where(eq(ledgers.id, suppLedger.id))
      .get();
    if (!deactivatedSuppLedger!.isFrozen) {
      throw new Error('Ledger was not frozen upon Supplier deactivation!');
    }
    logMsg(`✅ Supplier Ledger correctly frozen upon deactivation.`);

    logMsg(`\nVERDICT: PASS`);
    fs.writeFileSync('runtime-party-rehearsal.log', log.join('\n'));
    app.quit();
  } catch (e) {
    console.error('Rehearsal failed:', e);
    app.quit();
    process.exit(1);
  }
});
