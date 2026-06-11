import { CompanyProfileDto, UpdateCompanyProfileRequest } from '@vyora/types';

import { SettingsRepository, CompanyRepository } from '../repositories';

export class CompanyContextService {
  private settingsRepo = new SettingsRepository();
  private companyRepo = new CompanyRepository();
  private activeCompanyId: string | null = null;

  public async loadActiveCompany(): Promise<CompanyProfileDto | null> {
    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (id) {
      this.activeCompanyId = id;
      const company = await this.companyRepo.getById(id);
      return company as unknown as CompanyProfileDto | null;
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

  // Phase 5.1.2A - Backend Implementation
  public async getProfile(id: string): Promise<CompanyProfileDto | null> {
    const profile = await this.companyRepo.getById(id);
    return profile || null;
  }

  public async updateProfile(
    id: string,
    payload: UpdateCompanyProfileRequest,
  ): Promise<CompanyProfileDto> {
    const updateData = { ...payload };

    // Smart Pincode Lookup integration
    if (updateData.pincode && (!updateData.city || !updateData.district || !updateData.stateCode)) {
      try {
        const { smartPincodeLookupService } =
          await import('../modules/directories/pincode/SmartPincodeLookupService');
        const lookup = await smartPincodeLookupService.lookup(updateData.pincode);
        if (lookup.offices && lookup.offices.length > 0) {
          const office = lookup.offices[0];
          if (!updateData.district && office.district) {
            updateData.district = office.district;
          }
          if (!updateData.stateCode && office.stateName) {
            // Very simple fallback: we should normally map stateName to stateCode but here we just take stateName if code is missing
            // In a full implementation, we'd look up the exact code from a state directory.
            // For now, if stateCode is still missing, we don't block.
          }
        }
      } catch (e) {
        console.warn('Smart pincode lookup failed during company profile update', e);
      }
    }

    const updated = await this.companyRepo.updateProfile(id, updateData);
    if (!updated) {
      throw new Error(`Company profile with id ${id} not found.`);
    }

    return updated;
  }
}

export const companyContextService = new CompanyContextService();
