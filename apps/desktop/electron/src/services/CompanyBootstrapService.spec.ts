import { describe, it, expect, vi, beforeEach } from 'vitest';

import { currencyService } from '../modules/directories/currency/CurrencyService';
import { CompanyRepository, SettingsRepository } from '../repositories';

import { CompanyBootstrapService } from './CompanyBootstrapService';

vi.mock('../modules/directories/currency/CurrencyService', () => ({
  currencyService: {
    getByCode: vi.fn(),
  },
}));

vi.mock('./database/DatabaseService', () => ({
  dbService: {
    getDb: () => ({
      transaction: vi.fn((cb) => cb({})),
    }),
  },
}));

vi.mock('./database/SystemLedgerSeeder', () => ({
  systemLedgerSeeder: {
    seedSystemLedgers: vi.fn(),
  },
}));

describe('CompanyBootstrapService', () => {
  let service: CompanyBootstrapService;

  beforeEach(() => {
    service = new CompanyBootstrapService();
    vi.spyOn(CompanyRepository.prototype, 'createSync').mockReturnValue({
      id: 'comp-1',
    } as unknown as import('@vyora/types').CompanyDto);
    vi.spyOn(SettingsRepository.prototype, 'createCompanySettingsSync').mockReturnValue(
      {} as unknown as import('@vyora/database').CompanySetting,
    );
    vi.spyOn(SettingsRepository.prototype, 'setAppSettingSync').mockReturnValue(undefined);
    vi.clearAllMocks();
  });

  it('createCompany - valid currency', async () => {
    vi.mocked(currencyService.getByCode).mockResolvedValue({ success: true, data: {} });
    const result = await service.createCompany({
      legalName: 'Test Corp',
      isGstRegistered: false,
      financialYearStart: new Date(),
      currency: 'USD',
    });
    expect(result).toBe('comp-1');
    expect(currencyService.getByCode).toHaveBeenCalledWith('USD');
  });

  it('createCompany - invalid currency format', async () => {
    await expect(
      service.createCompany({
        legalName: 'Test Corp',
        isGstRegistered: false,
        financialYearStart: new Date(),
        currency: 'INVALID_LONG_CODE',
      }),
    ).rejects.toThrow('Currency code must be exactly 3 characters');
  });

  it('createCompany - inactive or missing currency', async () => {
    vi.mocked(currencyService.getByCode).mockResolvedValue({
      success: false,
      error: 'Currency "AED" is inactive',
    });
    await expect(
      service.createCompany({
        legalName: 'Test Corp',
        isGstRegistered: false,
        financialYearStart: new Date(),
        currency: 'AED',
      }),
    ).rejects.toThrow('Currency "AED" is inactive');
  });
});
