import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HsnRepository } from './HsnRepository';
import { DirectoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

vi.mock('../../../services/database/DirectoryDatabaseService');

describe('HsnRepository', () => {
  let repository: HsnRepository;
  let mockDbService: vi.Mocked<DirectoryDatabaseService>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockDbService = {
      getDb: vi.fn().mockReturnValue(mockDb),
    } as any;

    repository = new HsnRepository(mockDbService);
  });

  it('should throw error if db is not initialized', async () => {
    mockDbService.getDb.mockReturnValue(null as any);
    await expect(repository.getByCode('1234')).rejects.toThrow('Directory database is not initialized');
  });

  it('should get hsn by code', async () => {
    const mockHsn = { hsnCode: '1234', description: 'Test HSN' };
    mockDb.limit.mockResolvedValueOnce([mockHsn]);

    const result = await repository.getByCode('1234');

    expect(mockDbService.getDb).toHaveBeenCalled();
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.limit).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockHsn);
  });

  it('should search hsn', async () => {
    const mockHsn = { hsnCode: '1234', description: 'Test HSN' };
    mockDb.limit.mockResolvedValueOnce([mockHsn]);

    const result = await repository.search('123');

    expect(mockDbService.getDb).toHaveBeenCalled();
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.limit).toHaveBeenCalledWith(50);
    expect(result).toEqual([mockHsn]);
  });
});
