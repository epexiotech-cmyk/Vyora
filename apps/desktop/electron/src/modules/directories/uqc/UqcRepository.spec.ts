import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/dummy') },
}));

import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

import { UqcRepository } from './UqcRepository';

vi.mock('../../../services/database/DirectoryDatabaseService', () => ({
  directoryDatabaseService: {
    getDb: vi.fn(),
    execute: vi.fn(),
  },
}));

describe('UqcRepository', () => {
  let repository: UqcRepository;

  beforeEach(() => {
    repository = new UqcRepository();
    vi.clearAllMocks();
  });

  describe('findByCode', () => {
    it('should find UQC by code', async () => {
      const mockUqc = { id: 1, gstUqcCode: 'KGS', displayName: 'KILOGRAMS' };

      (directoryDatabaseService.execute as Mock).mockImplementationOnce(async () => {
        return mockUqc; // Mocking the internal db builder resolution
      });

      const result = await repository.findByCode('KGS');
      expect(result).toEqual(mockUqc);
      expect(directoryDatabaseService.execute).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return matched UQCs', async () => {
      const mockUqcs = [{ id: 1, gstUqcCode: 'KGS', displayName: 'KILOGRAMS' }];

      (directoryDatabaseService.execute as Mock).mockImplementationOnce(async () => {
        return mockUqcs;
      });

      const result = await repository.search('KG');
      expect(result).toEqual(mockUqcs);
    });
  });

  describe('count', () => {
    it('should return total count of active UQCs', async () => {
      (directoryDatabaseService.execute as Mock).mockImplementationOnce(async () => {
        return 42;
      });

      const result = await repository.count();
      expect(result).toBe(42);
    });
  });
});
