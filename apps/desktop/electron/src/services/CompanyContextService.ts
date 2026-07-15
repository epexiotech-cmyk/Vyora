import {
  CompanyProfileDto,
  UpdateCompanyProfileRequest,
  CompanyContextDto,
  CurrencyDto,
} from '@vyora/types';

import { SettingsRepository, CompanyRepository } from '../repositories';

export class CompanyContextService {
  private settingsRepo = new SettingsRepository();
  private companyRepo = new CompanyRepository();
  private activeCompanyId: string | null = null;
  private cachedContext: CompanyContextDto | null = null;

  public async loadActiveCompany(): Promise<CompanyProfileDto | null> {
    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (id) {
      if (this.activeCompanyId !== id) {
        this.activeCompanyId = id;
        this.cachedContext = null;
      }
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
    this.cachedContext = null;
  }

  // Phase 5.1.2A - Backend Implementation
  public async getProfile(id: string): Promise<CompanyProfileDto | null> {
    const profile = await this.companyRepo.getById(id);
    return profile || null;
  }

  public async getContext(): Promise<CompanyContextDto | null> {
    if (this.cachedContext) {
      return this.cachedContext;
    }

    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (!id) return null;

    const company = await this.getProfile(id);
    if (!company) return null;

    const settings = await this.settingsRepo.getCompanySettings(id);
    if (!settings || !settings.currency) return null;

    const { currencyService } = await import('../modules/directories/currency/CurrencyService');
    const currencyRes = await currencyService.getByCode(settings.currency);

    if (!currencyRes.success || !currencyRes.data) return null;

    const currencyDto = currencyRes.data as CurrencyDto;

    this.cachedContext = {
      company,
      currency: {
        currencyCode: currencyDto.currencyCode,
        currencyName: currencyDto.currencyName,
        symbol: currencyDto.symbol,
        locale: currencyDto.locale,
        decimalPlaces: currencyDto.decimalPlaces,
        symbolPosition: currencyDto.symbolPosition as 'PREFIX' | 'SUFFIX',
      },
    };

    return this.cachedContext;
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

    // Phase 8.6.2D: Validate and Update Currency
    if (updateData.currency) {
      const { currencyValidationSchema } = await import('@vyora/types');
      const { currencyService } = await import('../modules/directories/currency/CurrencyService');

      const currencyValidation = currencyValidationSchema.safeParse(updateData.currency);
      if (!currencyValidation.success) {
        throw new Error(currencyValidation.error.issues[0]?.message || 'Invalid currency format');
      }

      const currencyCode = currencyValidation.data;
      const currencyCheck = await currencyService.getByCode(currencyCode);

      if (!currencyCheck.success) {
        throw new Error(currencyCheck.error);
      }

      await this.settingsRepo.updateCompanySettings(id, { currency: currencyCode });

      // Remove currency from updateData so it doesn't get passed to companyRepo.updateProfile
      delete updateData.currency;
    }

    const updated = await this.companyRepo.updateProfile(id, updateData);
    if (!updated) {
      throw new Error(`Company profile with id ${id} not found.`);
    }

    if (this.activeCompanyId === id) {
      this.cachedContext = null;
    }

    return updated;
  }
}

export const companyContextService = new CompanyContextService();
