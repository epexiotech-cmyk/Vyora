import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CurrencyService } from './CurrencyService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => 'test-path'), isPackaged: false },
}));

vi.mock('../../../logger/LoggerService', () => ({
  loggerService: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@vyora/config', () => ({
  ResponseStatus: { SUCCESS: 'SUCCESS', ERROR: 'ERROR' },
}));

vi.mock('./CurrencyRepository', () => {
  return {
    CurrencyRepository: class {
      findByCode = vi.fn().mockResolvedValue({ currencyCode: 'USD' });
      search = vi.fn().mockResolvedValue([{ currencyCode: 'USD' }]);
      count = vi.fn().mockResolvedValue(1);
      getActive = vi.fn().mockResolvedValue([{ currencyCode: 'USD', isPrimary: true }]);
      getPrimary = vi
        .fn()
        .mockResolvedValue({ currencyCode: 'USD', currencyName: 'US Dollar', isPrimary: true });
    },
  };
});

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CurrencyService();
  });

  it('getByCode requires a code', async () => {
    const result = await service.getByCode('');
    expect(result.success).toBe(false);
  });

  it('search works', async () => {
    const result = await service.search('USD');
    expect(result.success).toBe(true);
  });

  it('getActive works', async () => {
    const result = await service.getActive();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('getPrimary works', async () => {
    const result = await service.getPrimary();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('validatePrimaryCurrencyAssignment works when valid', async () => {
    const result = await service.validatePrimaryCurrencyAssignment('USD');
    expect(result.success).toBe(true);
  });

  it('validatePrimaryCurrencyAssignment rejects if another primary exists', async () => {
    const result = await service.validatePrimaryCurrencyAssignment('INR');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already set as Primary');
  });
});
