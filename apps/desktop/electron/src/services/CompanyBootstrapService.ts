/* eslint-disable */
import { CompanyRepository, SettingsRepository } from '../repositories';
import { dbService } from './database/DatabaseService';

import { companyContextService } from './CompanyContextService';

export class CompanyBootstrapService {
  private companyRepo = new CompanyRepository();
  private settingsRepo = new SettingsRepository();

  public async hasCompany(): Promise<boolean> {
    const firstCompany = await this.companyRepo.getFirst();
    return !!firstCompany;
  }

  public async isSetupCompleted(): Promise<boolean> {
    const status = await this.settingsRepo.getAppSetting('setup_completed');
    return status === 'true';
  }

  public async createCompany(
    name: string,
    isGstRegistered: boolean,
    gstin: string | null,
    financialYearStart: Date,
    currency: string,
  ): Promise<string> {
    return await dbService.getDb().transaction(async (tx) => {
      // 1. Create base company record
      const company = await this.companyRepo.create(
        {
          name,
          gstin,
          address: null,
          phone: null,
          email: null,
        },
        tx,
      );

      // 2. Create company_settings (Financial Year, Currency)
      // 3 & 4 & 5. Default invoice, GST, numbering settings
      await this.settingsRepo.createCompanySettings(
        {
          companyId: company.id,
          financialYearStart,
          currency,
          isGstRegistered,
          salesPrefix: 'INV',
          purchasePrefix: 'PUR',
          defaultInvoiceNotes: 'Thank you for your business!',
        },
        tx,
      );

      // Set global flags
      await this.settingsRepo.setAppSetting('setup_completed', 'true', tx);
      await this.settingsRepo.setAppSetting('active_company_id', company.id, tx);

      return company.id;
    });
  }
}

export const companyBootstrapService = new CompanyBootstrapService();
