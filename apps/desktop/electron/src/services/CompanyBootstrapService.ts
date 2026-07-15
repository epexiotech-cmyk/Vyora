import { CreateCompanyInput, currencyValidationSchema } from '@vyora/types';

import { currencyService } from '../modules/directories/currency/CurrencyService';
import { CompanyRepository, SettingsRepository } from '../repositories';
import { FinancialYearRepository } from '../repositories/FinancialYearRepository';

import { dbService } from './database/DatabaseService';
import { systemLedgerSeeder } from './database/SystemLedgerSeeder';

export class CompanyBootstrapService {
  private companyRepo = new CompanyRepository();
  private settingsRepo = new SettingsRepository();
  private fyRepo = new FinancialYearRepository();

  public async hasCompany(): Promise<boolean> {
    const firstCompany = await this.companyRepo.getFirst();
    return !!firstCompany;
  }

  public async isSetupCompleted(): Promise<boolean> {
    const status = await this.settingsRepo.getAppSetting('setup_completed');
    return status === 'true';
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
          salesPrefix: 'INV',
          purchasePrefix: 'PUR',
          defaultInvoiceNotes: 'Thank you for your business!',
        },
        tx,
      );

      // Create the active financial year for the new company
      const startYear = input.financialYearStart.getFullYear();
      const endYear = startYear + 1;
      const fyLabel = `FY ${startYear}-${endYear.toString().slice(2)}`;

      const fyStart = new Date(`${startYear}-04-01T00:00:00.000Z`);
      const fyEnd = new Date(`${endYear}-03-31T23:59:59.999Z`);

      this.fyRepo.createSync(
        {
          companyId: company.id,
          label: fyLabel,
          startDate: fyStart,
          endDate: fyEnd,
          isActive: true,
        },
        tx,
      );

      // Set global flags
      this.settingsRepo.setAppSettingSync('setup_completed', 'true', tx);
      this.settingsRepo.setAppSettingSync('active_company_id', company.id, tx);

      systemLedgerSeeder.seedSystemLedgers(company.id, tx);

      return company.id;
    });
  }
}

export const companyBootstrapService = new CompanyBootstrapService();
