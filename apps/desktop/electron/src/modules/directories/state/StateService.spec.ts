import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StateService } from './StateService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => 'test-path'), isPackaged: false },
}));

vi.mock('../../../logger/LoggerService', () => ({
  loggerService: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@vyora/config', () => ({
  ResponseStatus: { SUCCESS: 'SUCCESS', ERROR: 'ERROR' },
}));

vi.mock('./StateRepository', () => {
  return {
    StateRepository: class {
      findByCode = vi.fn().mockResolvedValue({ stateCode: '24' });
      search = vi.fn().mockResolvedValue([{ stateCode: '24' }]);
      count = vi.fn().mockResolvedValue(1);
    },
  };
});

describe('StateService', () => {
  let service: StateService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StateService();
  });

  it('getByCode requires a code', async () => {
    const result = await service.getByCode('');
    expect(result.success).toBe(false);
  });

  it('search works', async () => {
    const result = await service.search('Guj');
    expect(result.success).toBe(true);
  });
});
