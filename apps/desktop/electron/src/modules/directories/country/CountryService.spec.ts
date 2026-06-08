import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CountryService } from './CountryService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => 'test-path'), isPackaged: false },
}));

vi.mock('../../../logger/LoggerService', () => ({
  loggerService: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@vyora/config', () => ({
  ResponseStatus: { SUCCESS: 'SUCCESS', ERROR: 'ERROR' },
}));

vi.mock('./CountryRepository', () => {
  return {
    CountryRepository: class {
      findByCode = vi.fn().mockResolvedValue({ countryCode: 'IN' });
      search = vi.fn().mockResolvedValue([{ countryCode: 'IN' }]);
      count = vi.fn().mockResolvedValue(1);
    },
  };
});

describe('CountryService', () => {
  let service: CountryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CountryService();
  });

  it('getByCode requires a code', async () => {
    const result = await service.getByCode('');
    expect(result.success).toBe(false);
  });

  it('search works', async () => {
    const result = await service.search('Ind');
    expect(result.success).toBe(true);
  });
});
