export * from './appSettingsHandlers';
export * from './bootstrapHandlers';
export * from './calculationHandlers';
export * from './companyHandlers';
export * from './countryHandlers';
export * from './currencyHandlers';
export * from './customerHandlers';
export * from './financialYearHandlers';
export * from './inventoryHandlers';
export * from './journalHandlers';
export * from './pincodeHandlers';
export * from './printHandlers';
export * from './productHandlers';
export * from './purchaseHandlers';
export * from './salesHandlers';
export * from './stateHandlers';
export * from './taxHandlers';
export * from './unitHandlers';
export * from './uqcHandlers';
export * from './hsnHandlers';
export * from './reportsHandlers';
export * from './sacHandlers';
export * from './accountingHandlers';
export * from './authHandlers';
export * from './systemHandlers';
export * from './documentNumberingHandlers';
export * from './paymentAccountHandlers';
export * from './fundTransferHandlers';
export * from './developerDatabaseHandlers';
export * from './exportHandlers';

import { DeveloperFeatures } from '../../main/DeveloperFeatures';

import { registerAccountingHandlers } from './accountingHandlers';
import { registerAppSettingsHandlers } from './appSettingsHandlers';
import { registerAuthHandlers } from './authHandlers';
import { registerBootstrapHandlers } from './bootstrapHandlers';
import { registerCalculationHandlers } from './calculationHandlers';
import { registerChartOfAccountsHandlers } from './chartOfAccountsHandlers';
import { registerCompanyHandlers } from './companyHandlers';
import { registerCountryHandlers } from './countryHandlers';
import { registerCurrencyHandlers } from './currencyHandlers';
import { registerCustomerHandlers } from './customerHandlers';
import { registerDeveloperDatabaseHandlers } from './developerDatabaseHandlers';
import { registerDeveloperFeaturesHandlers } from './developerFeaturesHandlers';
import { registerDevHandlers } from './devHandlers';
import { registerDocumentNumberingHandlers } from './documentNumberingHandlers';
import { registerExportHandlers } from './exportHandlers';
import { registerFinancialYearHandlers } from './financialYearHandlers';
import { registerFundTransferHandlers } from './fundTransferHandlers';
import { registerHsnHandlers } from './hsnHandlers';
import { registerInventoryHandlers } from './inventoryHandlers';
import { registerJournalHandlers } from './journalHandlers';
import { registerPaymentAccountHandlers } from './paymentAccountHandlers';
import { registerPincodeHandlers } from './pincodeHandlers';
import { registerPrintHandlers } from './printHandlers';
import { registerProductHandlers } from './productHandlers';
import { registerPurchaseHandlers } from './purchaseHandlers';
import { registerReportsHandlers } from './reportsHandlers';
import { registerSacHandlers } from './sacHandlers';
import { registerSalesInvoiceHandlers } from './salesHandlers';
import { registerStateHandlers } from './stateHandlers';
import { registerSupplierHandlers } from './supplierHandlers';
import { registerSystemHandlers } from './systemHandlers';
import { registerTaxHandlers } from './taxHandlers';
import { registerUnitHandlers } from './unitHandlers';
import { registerUqcHandlers } from './uqcHandlers';

export function registerAllHandlers() {
  registerAuthHandlers();
  registerSystemHandlers();
  registerBootstrapHandlers();
  registerCalculationHandlers();
  registerCompanyHandlers();
  registerCustomerHandlers();
  registerFinancialYearHandlers();
  registerInventoryHandlers();
  registerJournalHandlers();
  registerProductHandlers();
  registerPurchaseHandlers();
  registerSupplierHandlers();
  registerSalesInvoiceHandlers();
  registerTaxHandlers();
  registerUnitHandlers();
  registerPrintHandlers();
  registerPincodeHandlers();
  registerCountryHandlers();
  registerCurrencyHandlers();
  registerStateHandlers();
  registerUqcHandlers();
  registerHsnHandlers();
  registerSacHandlers();
  registerAccountingHandlers();
  registerChartOfAccountsHandlers();
  registerReportsHandlers();
  registerDocumentNumberingHandlers();
  registerAppSettingsHandlers();

  registerPaymentAccountHandlers();
  registerFundTransferHandlers();
  registerExportHandlers();

  // Register unconditional developer features check
  registerDeveloperFeaturesHandlers();

  if (DeveloperFeatures.isEnabled()) {
    registerDevHandlers();
    registerDeveloperDatabaseHandlers();
  }
}
