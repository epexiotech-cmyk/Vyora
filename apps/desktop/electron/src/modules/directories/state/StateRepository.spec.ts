import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StateRepository } from './StateRepository';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => 'test-path'), isPackaged: false },
}));

vi.mock('../../../services/database/DirectoryDatabaseService', () => ({
  directoryDatabaseService: {
    getDb: vi.fn(),
    execute: vi.fn((cb) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ stateCode: '24' }),
        all: vi.fn().mockResolvedValue([{ stateCode: '24' }]),
      }),
    ),
  },
}));

describe('StateRepository', () => {
  let repository: StateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new StateRepository();
  });

  it('should find by code', async () => {
    const result = await repository.findByCode('24');
    expect(result).toBeDefined();
  });

  it('should search states', async () => {
    const results = await repository.search('Guj');
    expect(results).toHaveLength(1);
  });
});
