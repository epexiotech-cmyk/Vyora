import { CreateCompanyInput, currencyValidationSchema } from '@vyora/types';

import { currencyService } from '../modules/directories/currency/CurrencyService';
import { CompanyRepository, SettingsRepository } from '../repositories';

import { dbService } from './database/DatabaseService';
import { paymentAccountBootstrapService } from './database/PaymentAccountBootstrapService';
import { systemExpensePresetSeeder } from './database/SystemExpensePresetSeeder';
import { systemLedgerSeeder } from './database/SystemLedgerSeeder';
import { systemSupplierSeeder } from './database/SystemSupplierSeeder';
import { systemTaxSeeder } from './database/SystemTaxSeeder';
import { systemUnitSeeder } from './database/SystemUnitSeeder';
import { financialYearService } from './FinancialYearService';

export class CompanyBootstrapService {
  private companyRepo = new CompanyRepository();
  private settingsRepo = new SettingsRepository();

  public async hasCompany(): Promise<boolean> {
    const firstCompany = await this.companyRepo.getFirst();
    return !!firstCompany;
  }

  public async isSetupCompleted(): Promise<boolean> {
    const { authService } = await import('./AuthService');
    const adminCount = await authService.getAdminCount();
    const hasCompany = await this.hasCompany();

    // Log for trace
    const { loggerService } = await import('./logger/LoggerService');
    loggerService.info(
      `[TRACE] CompanyBootstrapService.isSetupCompleted() - adminCount: ${adminCount}, companyCount: ${hasCompany ? 1 : 0}`,
    );

    if (adminCount > 0 && hasCompany) {
      loggerService.info(
        `[TRACE] CompanyBootstrapService.isSetupCompleted() - Returning TRUE (admin and company exist)`,
      );
      return true;
    }

    loggerService.info(`[TRACE] CompanyBootstrapService.isSetupCompleted() - Returning FALSE`);
    return false;
  }

  public async createCompany(input: CreateCompanyInput): Promise<string> {
    // Phase 8.6.2D: Validate Currency
    const currencyValidation = currencyValidationSchema.safeParse(input.currency);
    if (!currencyValidation.success) {
      throw new Error(currencyValidation.error.issues[0]?.message || 'Invalid currency format');
    }

    const currencyCode = currencyValidation.data;
    const currencyCheck = await currencyService.getByCode(currencyCode);

    if (!currencyCheck.success) {
      throw new Error(currencyCheck.error);
    }

    return dbService.getDb().transaction((tx) => {
      // 1. Create base company record
      const company = this.companyRepo.createSync(
        {
          legalName: input.legalName,
          gstin: input.gstin || null,
        },
        tx,
      );

      // 2. Create company_settings (Financial Year, Currency)
      // 3 & 4 & 5. Default invoice, GST, numbering settings
      this.settingsRepo.createCompanySettingsSync(
        {
          companyId: company.id,
          financialYearStart: input.financialYearStart,
          currency: input.currency,
          isGstRegistered: input.isGstRegistered,
          defaultInvoiceNotes: 'Thank you for your business!',
        },
        tx,
      );

      const startYear = input.financialYearStart.getFullYear();
      const endYear = startYear + 1;

      const fyStart = new Date(`${startYear}-04-01T00:00:00.000Z`);
      const fyEnd = new Date(`${endYear}-03-31T23:59:59.999Z`);

      financialYearService.createFinancialYearSync(
        company.id,
        {
          startDate: fyStart,
          endDate: fyEnd,
          activateAfterCreate: true,
        },
        tx,
      );

      // Set global flags
      // TODO: 'setup_completed' is legacy technical debt.
      // It is no longer used for setup validation but kept temporarily for backward compatibility.
      this.settingsRepo.setAppSettingSync('setup_completed', 'true', tx);
      this.settingsRepo.setAppSettingSync('active_company_id', company.id, tx);

      systemLedgerSeeder.seedSystemLedgers(company.id, tx);

      paymentAccountBootstrapService.seedPaymentAccounts(company.id, tx);

      systemUnitSeeder.seedSystemUnits(company.id, tx);
      systemTaxSeeder.seedSystemTaxes(company.id, tx);
      systemExpensePresetSeeder.seedExpensePresets(company.id, tx);
      systemSupplierSeeder.getOrCreateMiscellaneousSupplierSync(company.id, tx);

      return company.id;
    });
  }
}

export const companyBootstrapService = new CompanyBootstrapService();
