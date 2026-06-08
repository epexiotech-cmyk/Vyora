import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

import { HsnRepository } from './HsnRepository';
import { HsnService } from './HsnService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

vi.mock('../../../services/logger/LoggerService', () => ({
  loggerService: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('./HsnRepository');

describe('HsnService', () => {
  let service: HsnService;
  let mockRepository: Mocked<HsnRepository>;

  beforeEach(() => {
    mockRepository = {
      getByCode: vi.fn(),
      search: vi.fn(),
    } as unknown as Mocked<HsnRepository>;

    service = new HsnService(mockRepository);
  });

  describe('getByCode', () => {
    it('should return hsn code if found', async () => {
      const mockHsn = { id: 1, hsnCode: '1234', description: 'Test', isActive: true };
      mockRepository.getByCode.mockResolvedValueOnce(mockHsn);

      const result = await service.getByCode('1234');

      expect(mockRepository.getByCode).toHaveBeenCalledWith('1234');
      expect(result).toEqual({ success: true, data: mockHsn });
    });

    it('should return error if not found', async () => {
      mockRepository.getByCode.mockResolvedValueOnce(null);

      const result = await service.getByCode('1234');

      expect(result).toEqual({ success: false, error: 'HSN code not found' });
    });

    it('should handle repository errors', async () => {
      mockRepository.getByCode.mockRejectedValueOnce(new Error('DB Error'));

      const result = await service.getByCode('1234');

      expect(result).toEqual({ success: false, error: 'Failed to retrieve HSN code' });
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockHsn = { id: 1, hsnCode: '1234', description: 'Test', isActive: true };
      mockRepository.search.mockResolvedValueOnce([mockHsn]);

      const result = await service.search('123');

      expect(mockRepository.search).toHaveBeenCalledWith('123', undefined);
      expect(result).toEqual({ success: true, data: [mockHsn] });
    });

    it('should handle search errors', async () => {
      mockRepository.search.mockRejectedValueOnce(new Error('DB Error'));

      const result = await service.search('123');

      expect(result).toEqual({ success: false, error: 'Failed to search HSN codes' });
    });
  });
});
