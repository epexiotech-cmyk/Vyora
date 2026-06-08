import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/dummy') },
}));
import { UqcRepository } from './UqcRepository';
import { UqcService } from './UqcService';

describe('UqcService', () => {
  let service: UqcService;

  beforeEach(() => {
    service = new UqcService();
    vi.spyOn(UqcRepository.prototype, 'findByCode').mockImplementation(async (code: string) => {
      if (code === 'KGS') return { id: 1, gstUqcCode: 'KGS', displayName: 'KILOGRAMS' } as never;
      return null;
    });
    vi.spyOn(UqcRepository.prototype, 'search').mockImplementation(async (query: string) => {
      if (query === 'KG') return [{ id: 1, gstUqcCode: 'KGS', displayName: 'KILOGRAMS' }] as never;
      return [];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getByCode', () => {
    it('should return error if code is empty', async () => {
      const result = await service.getByCode('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('UQC code is required');
    });

    it('should return data if code is found', async () => {
      const result = await service.getByCode('KGS');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as { gstUqcCode: string }).gstUqcCode).toBe('KGS');
    });

    it('should return error if code is not found', async () => {
      const result = await service.getByCode('XYZ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('UQC not found');
    });
  });

  describe('search', () => {
    it('should return matching results', async () => {
      const result = await service.search('KG');
      expect(result.success).toBe(true);
      expect((result.data as unknown[]).length).toBe(1);
    });

    it('should return empty array if no match', async () => {
      const result = await service.search('XYZ');
      expect(result.success).toBe(true);
      expect((result.data as unknown[]).length).toBe(0);
    });
  });
});
