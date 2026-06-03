import { SettingsRepository } from '../repositories';

export class CompanyContextService {
  private settingsRepo = new SettingsRepository();
  private activeCompanyId: string | null = null;

  public async loadActiveCompany(): Promise<string | null> {
    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (id) {
      this.activeCompanyId = id;
    }
    return this.activeCompanyId;
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
