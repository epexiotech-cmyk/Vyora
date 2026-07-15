import { describe, it, expect, vi, beforeEach } from 'vitest';

import { currencyService } from '../modules/directories/currency/CurrencyService';
import { CompanyRepository, SettingsRepository } from '../repositories';

import { CompanyContextService } from './CompanyContextService';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue(''),
  },
}));

vi.mock('../modules/directories/currency/CurrencyService', () => ({
  currencyService: {
    getByCode: vi.fn(),
  },
}));

describe('CompanyContextService', () => {
  let service: CompanyContextService;

  beforeEach(() => {
    service = new CompanyContextService();
    vi.spyOn(CompanyRepository.prototype, 'updateProfile').mockResolvedValue({
      id: 'comp-1',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'updateCompanySettings').mockResolvedValue(
      {} as unknown as import('@vyora/database').CompanySetting,
    );
    vi.spyOn(SettingsRepository.prototype, 'setAppSetting').mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('updateProfile - without currency', async () => {
    const result = await service.updateProfile('comp-1', { legalName: 'New Name' });
    expect(result.id).toBe('comp-1');
    expect(currencyService.getByCode).not.toHaveBeenCalled();
    expect(SettingsRepository.prototype.updateCompanySettings).not.toHaveBeenCalled();
  });

  it('updateProfile - with valid currency', async () => {
    vi.mocked(currencyService.getByCode).mockResolvedValue({ success: true, data: {} });
    const result = await service.updateProfile('comp-1', {
      legalName: 'New Name',
      currency: 'INR',
    });
    expect(result.id).toBe('comp-1');
    expect(currencyService.getByCode).toHaveBeenCalledWith('INR');
    expect(SettingsRepository.prototype.updateCompanySettings).toHaveBeenCalledWith('comp-1', {
      currency: 'INR',
    });
  });

  it('updateProfile - with invalid currency format', async () => {
    await expect(
      service.updateProfile('comp-1', {
        currency: 'INVALID_LONG_CODE',
      }),
    ).rejects.toThrow('Currency code must be exactly 3 characters');
  });

  it('updateProfile - with inactive or missing currency', async () => {
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: false,
      error: 'Currency "AED" is inactive',
    });
    await expect(
      service.updateProfile('comp-1', {
        currency: 'AED',
      }),
    ).rejects.toThrow('Currency "AED" is inactive');
  });

  it('getContext - constructs and returns context', async () => {
    vi.spyOn(SettingsRepository.prototype, 'getAppSetting').mockResolvedValue('comp-1');
    vi.spyOn(CompanyRepository.prototype, 'getById').mockResolvedValue({
      id: 'comp-1',
      legalName: 'Test',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'getCompanySettings').mockResolvedValue({
      currency: 'INR',
    } as unknown as import('@vyora/database').CompanySetting);
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: true,
      data: {
        currencyCode: 'INR',
        currencyName: 'Rupee',
        symbol: '₹',
        locale: 'en-IN',
        decimalPlaces: 2,
        symbolPosition: 'PREFIX',
      },
    });

    const context = await service.getContext();
    expect(context).toBeDefined();
    expect(context?.company.id).toBe('comp-1');
    expect(context?.currency.currencyCode).toBe('INR');
  });

  it('getContext - returns cached context on subsequent calls', async () => {
    vi.spyOn(SettingsRepository.prototype, 'getAppSetting').mockResolvedValue('comp-1');
    vi.spyOn(CompanyRepository.prototype, 'getById').mockResolvedValue({
      id: 'comp-1',
      legalName: 'Test',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'getCompanySettings').mockResolvedValue({
      currency: 'INR',
    } as unknown as import('@vyora/database').CompanySetting);
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: true,
      data: {
        currencyCode: 'INR',
        currencyName: 'Rupee',
        symbol: '₹',
        locale: 'en-IN',
        decimalPlaces: 2,
        symbolPosition: 'PREFIX',
      },
    });

    const context1 = await service.getContext();
    expect(SettingsRepository.prototype.getAppSetting).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    const context2 = await service.getContext();
    expect(context2).toBe(context1);
    expect(SettingsRepository.prototype.getAppSetting).not.toHaveBeenCalled();
  });

  it('setActiveCompany - invalidates cache', async () => {
    await service.setActiveCompany('comp-2');

    vi.spyOn(SettingsRepository.prototype, 'getAppSetting').mockResolvedValue('comp-2');
    vi.spyOn(CompanyRepository.prototype, 'getById').mockResolvedValue({
      id: 'comp-2',
      legalName: 'Test 2',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'getCompanySettings').mockResolvedValue({
      currency: 'USD',
    } as unknown as import('@vyora/database').CompanySetting);
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: true,
      data: {
        currencyCode: 'USD',
        currencyName: 'Dollar',
        symbol: '$',
        locale: 'en-US',
        decimalPlaces: 2,
        symbolPosition: 'PREFIX',
      },
    });

    await service.getContext();
    expect(SettingsRepository.prototype.getAppSetting).toHaveBeenCalled();
  });

  it('updateProfile - invalidates cache for active company', async () => {
    vi.spyOn(SettingsRepository.prototype, 'getAppSetting').mockResolvedValue('comp-1');
    vi.spyOn(CompanyRepository.prototype, 'getById').mockResolvedValue({
      id: 'comp-1',
      legalName: 'Test',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'getCompanySettings').mockResolvedValue({
      currency: 'INR',
    } as unknown as import('@vyora/database').CompanySetting);
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: true,
      data: {
        currencyCode: 'INR',
        currencyName: 'Rupee',
        symbol: '₹',
        locale: 'en-IN',
        decimalPlaces: 2,
        symbolPosition: 'PREFIX',
      },
    });

    await service.loadActiveCompany();
    await service.getContext();

    vi.clearAllMocks();

    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: true,
      data: {
        currencyCode: 'AED',
        currencyName: 'Dirham',
        symbol: 'د.إ',
        locale: 'ar-AE',
        decimalPlaces: 2,
        symbolPosition: 'SUFFIX',
      },
    });
    await service.updateProfile('comp-1', { legalName: 'New Name', currency: 'AED' });

    await service.getContext();
    expect(SettingsRepository.prototype.getCompanySettings).toHaveBeenCalledWith('comp-1');
  });
});
