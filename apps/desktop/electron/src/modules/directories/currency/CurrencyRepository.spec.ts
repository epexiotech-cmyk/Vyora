import { beforeEach, describe, expect, it, vi } from 'vitest';

import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

import { CurrencyRepository } from './CurrencyRepository';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => 'test-path'), isPackaged: false },
}));

vi.mock('../../../services/database/DirectoryDatabaseService', () => {
  return {
    directoryDatabaseService: {
      getDb: vi.fn(),
      execute: vi.fn(async (cb) => {
        const mockDb = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn(),
          all: vi.fn(),
        };
        return cb(mockDb);
      }),
    },
  };
});

describe('CurrencyRepository', () => {
  let repository: CurrencyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CurrencyRepository();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('findByCode executes via directoryDatabaseService.execute', async () => {
    await repository.findByCode('USD');
    expect(directoryDatabaseService.execute).toHaveBeenCalled();
  });

  it('search executes via directoryDatabaseService.execute', async () => {
    await repository.search('Dollar');
    expect(directoryDatabaseService.execute).toHaveBeenCalled();
  });

  it('count executes via directoryDatabaseService.execute', async () => {
    await repository.count();
    expect(directoryDatabaseService.execute).toHaveBeenCalled();
  });

  it('getActive executes via directoryDatabaseService.execute', async () => {
    await repository.getActive();
    expect(directoryDatabaseService.execute).toHaveBeenCalled();
  });

  it('getPrimary executes via directoryDatabaseService.execute', async () => {
    await repository.getPrimary();
    expect(directoryDatabaseService.execute).toHaveBeenCalled();
  });
});
