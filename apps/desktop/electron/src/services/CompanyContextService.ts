import { CompanyDto } from '@vyora/types';

import { SettingsRepository, CompanyRepository } from '../repositories';

export class CompanyContextService {
  private settingsRepo = new SettingsRepository();
  private companyRepo = new CompanyRepository();
  private activeCompanyId: string | null = null;

  public async loadActiveCompany(): Promise<CompanyDto | null> {
    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (id) {
      this.activeCompanyId = id;
      const company = await this.companyRepo.getById(id);
      return company || null;
    }
    return null;
  }

  public getActiveCompany(): string | null {
    return this.activeCompanyId;
  }

  public async setActiveCompany(companyId: string): Promise<void> {
    await this.settingsRepo.setAppSetting('active_company_id', companyId);
    this.activeCompanyId = companyId;
  }
}

export const companyContextService = new CompanyContextService();
