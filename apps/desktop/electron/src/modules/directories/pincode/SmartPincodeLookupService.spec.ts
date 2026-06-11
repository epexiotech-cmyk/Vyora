import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PincodeDynamicCacheRepository } from './PincodeDynamicCacheRepository';
import { IPincodeProvider } from './providers/IPincodeProvider';
import { SmartPincodeLookupService } from './SmartPincodeLookupService';

describe('SmartPincodeLookupService', () => {
  let mockCacheRepository: Record<string, import('vitest').Mock>;
  let mockMasterProvider: Record<string, import('vitest').Mock>;
  let mockApiProvider: Record<string, import('vitest').Mock>;
  let service: unknown;

  beforeEach(() => {
    mockCacheRepository = {
      findByPincode: vi.fn(),
      saveMany: vi.fn(),
      incrementLookupStats: vi.fn().mockResolvedValue(undefined),
    };
    mockMasterProvider = {
      lookup: vi.fn(),
    };
    mockApiProvider = {
      lookup: vi.fn(),
    };

    service = new SmartPincodeLookupService(
      mockCacheRepository as unknown as PincodeDynamicCacheRepository,
      mockMasterProvider as unknown as IPincodeProvider,
      mockApiProvider as unknown as IPincodeProvider,
    );
  });

  it('returns CACHE hit and increments stats', async () => {
    const cachedData = [{ pincode: '390001', officeName: 'Baranpura' }];
    (mockCacheRepository.findByPincode as import('vitest').Mock).mockResolvedValue(cachedData);

    const result = await (service as SmartPincodeLookupService).lookup('390001');

    expect(result.source).toBe('CACHE');
    expect(result.offices).toEqual(cachedData);
    expect(mockCacheRepository.incrementLookupStats).toHaveBeenCalledWith('390001');
    expect(mockMasterProvider.lookup).not.toHaveBeenCalled();
    expect(mockApiProvider.lookup).not.toHaveBeenCalled();
  });

  it('returns MASTER hit if not in cache', async () => {
    mockCacheRepository.findByPincode.mockResolvedValue([]);
    const masterData = [{ pincode: '390001', officeName: 'Vadodara' }];
    mockMasterProvider.lookup.mockResolvedValue(masterData);

    const result = await (service as SmartPincodeLookupService).lookup('390001');

    expect(result.source).toBe('MASTER');
    expect(result.offices).toEqual(masterData);
    expect(mockApiProvider.lookup).not.toHaveBeenCalled();
  });

  it('falls back to API if not in cache or master, and saves to cache', async () => {
    mockCacheRepository.findByPincode.mockResolvedValue([]);
    mockMasterProvider.lookup.mockResolvedValue([]);
    const apiData = [{ pincode: '390001', officeName: 'Vadodara API' }];
    mockApiProvider.lookup.mockResolvedValue(apiData);
    mockCacheRepository.saveMany.mockResolvedValue(apiData);

    const result = await (service as SmartPincodeLookupService).lookup('390001');

    expect(result.source).toBe('API');
    expect(result.offices).toEqual(apiData);
    expect(mockCacheRepository.saveMany).toHaveBeenCalled();
  });

  it('returns NOT_FOUND if api returns empty gracefully', async () => {
    mockCacheRepository.findByPincode.mockResolvedValue([]);
    mockMasterProvider.lookup.mockResolvedValue([]);
    mockApiProvider.lookup.mockResolvedValue([]);

    const result = await (service as SmartPincodeLookupService).lookup('999999');

    expect(result.source).toBe('NOT_FOUND');
    expect(result.offices).toEqual([]);
  });

  it('gracefully handles exceptions in providers (Offline-first rule)', async () => {
    mockCacheRepository.findByPincode.mockRejectedValue(new Error('DB failure'));

    const result = await (service as SmartPincodeLookupService).lookup('999999');

    expect(result.source).toBe('NOT_FOUND');
    expect(result.offices).toEqual([]);
    expect(result.error).toBe('DB failure');
  });
});
