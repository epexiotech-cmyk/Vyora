import {
  CompanyProfileDto,
  UpdateCompanyProfileRequest,
  CompanyContextDto,
  CurrencyDto,
  CreateCompanyInput,
  CurrencyMeta,
} from '@vyora/types';

import { SettingsRepository, CompanyRepository } from '../repositories';

import { companyBootstrapService } from './CompanyBootstrapService';

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
    if (profile && profile.logoPath) {
      // Inline migration for any previously stored absolute paths
      if (profile.logoPath.includes('/') || profile.logoPath.includes('\\')) {
        const basename = profile.logoPath.replace(/^.*[\\/]/, '');
        profile.logoPath = basename;
        // Optionally update it in DB
        await this.companyRepo.updateProfile(id, { logoPath: basename });
      }
    }
    return (profile as unknown as CompanyProfileDto) || null;
  }

  public async getContext(): Promise<CompanyContextDto | null> {
    if (this.cachedContext) {
      return this.cachedContext;
    }

    const id = await this.settingsRepo.getAppSetting('active_company_id');
    if (!id) return null;

    const company = await this.getProfile(id);
    if (!company) return null;

    let currencyMeta: CurrencyMeta | null = null;

    const settings = await this.settingsRepo.getCompanySettings(id);
    if (settings && settings.currency) {
      const { currencyService } = await import('../modules/directories/currency/CurrencyService');
      const currencyRes = await currencyService.getByCode(settings.currency);

      if (currencyRes.success && currencyRes.data) {
        const currencyDto = currencyRes.data as CurrencyDto;
        currencyMeta = {
          currencyCode: currencyDto.currencyCode,
          currencyName: currencyDto.currencyName,
          symbol: currencyDto.symbol,
          locale: currencyDto.locale,
          decimalPlaces: currencyDto.decimalPlaces,
          symbolPosition: currencyDto.symbolPosition as 'PREFIX' | 'SUFFIX',
        };
      }
    }

    this.cachedContext = {
      company,
      currency: currencyMeta as unknown as CurrencyMeta,
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

    if (updateData.defaultUpiId) {
      if (!/^[^@\s]+@[^@\s]+$/.test(updateData.defaultUpiId)) {
        throw new Error('Invalid UPI ID format');
      }
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

  public async getLogoPath(companyId: string): Promise<string | null> {
    const profile = await this.getProfile(companyId);
    return profile?.logoPath || null;
  }

  public async uploadLogo(
    companyId: string,
    filename: string,
    buffer: Buffer | ArrayBuffer | ArrayBufferView,
  ): Promise<CompanyProfileDto> {
    if (!filename || !buffer) {
      throw new Error('Invalid logo file data provided.');
    }

    let nodeBuffer: Buffer;

    if (Buffer.isBuffer(buffer)) {
      nodeBuffer = buffer;
    } else if (buffer instanceof ArrayBuffer) {
      nodeBuffer = Buffer.from(buffer);
    } else if (ArrayBuffer.isView(buffer)) {
      nodeBuffer = Buffer.from(buffer.buffer);
    } else {
      throw new Error('Invalid logo buffer received.');
    }

    if (nodeBuffer.length === 0) {
      throw new Error('Invalid logo file data provided.');
    }

    if (nodeBuffer.length > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit.');
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      throw new Error('Invalid logo file type. Only png, jpg, jpeg, webp, and svg are allowed.');
    }

    const { fileSystemService } = await import('./filesystem/FileSystemService');

    const profile = await this.getProfile(companyId);
    if (!profile) {
      throw new Error(`Company profile with id ${companyId} not found.`);
    }

    const previousLogoPath = profile.logoPath;
    const timestamp = Date.now();
    const newFilename = `company-logo-${timestamp}.${ext}`;

    try {
      fileSystemService.saveCompanyLogo(companyId, newFilename, nodeBuffer);
    } catch (err) {
      throw new Error(`Failed to save logo file: ${(err as Error).message}`);
    }

    try {
      await this.companyRepo.updateProfile(companyId, { logoPath: newFilename });
    } catch (err) {
      fileSystemService.deleteCompanyLogo(companyId, newFilename);
      throw new Error(`Failed to update database: ${(err as Error).message}`);
    }

    if (previousLogoPath && previousLogoPath !== newFilename) {
      try {
        fileSystemService.deleteCompanyLogo(companyId, previousLogoPath);
      } catch (err) {
        console.warn('Failed to delete previous logo', err);
      }
    }

    if (this.activeCompanyId === companyId) {
      this.cachedContext = null;
    }

    const updatedProfile = await this.getProfile(companyId);
    return updatedProfile!;
  }

  public async deleteLogo(companyId: string): Promise<CompanyProfileDto> {
    const { fileSystemService } = await import('./filesystem/FileSystemService');
    const profile = await this.getProfile(companyId);
    if (!profile) {
      throw new Error(`Company profile with id ${companyId} not found.`);
    }

    const previousLogoPath = profile.logoPath;
    if (previousLogoPath) {
      await this.companyRepo.updateProfile(companyId, { logoPath: null });
      try {
        fileSystemService.deleteCompanyLogo(companyId, previousLogoPath);
      } catch (err) {
        console.warn('Failed to delete previous logo from disk', err);
      }
    }

    if (this.activeCompanyId === companyId) {
      this.cachedContext = null;
    }

    const updatedProfile = await this.getProfile(companyId);
    return updatedProfile!;
  }

  public async listCompanies(): Promise<import('@vyora/types').CompanyDto[]> {
    return this.companyRepo.list();
  }

  public async createCompany(payload: CreateCompanyInput): Promise<string> {
    return companyBootstrapService.createCompany(payload);
  }

  public async deleteCompany(companyId: string): Promise<void> {
    const activeId = await this.settingsRepo.getAppSetting('active_company_id');
    if (activeId === companyId) {
      throw new Error('Cannot delete the currently active company.');
    }

    const allCompanies = await this.companyRepo.list();
    if (allCompanies.length <= 1) {
      throw new Error('Cannot delete the last remaining company.');
    }

    // TODO: In the future, check if company has existing accounting data before deleting
    // For now, we allow soft delete
    await this.companyRepo.softDelete(companyId);
  }
}

export const companyContextService = new CompanyContextService();
