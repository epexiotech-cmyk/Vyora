import { PincodeDTO } from '@vyora/types';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { PincodeRepository } from './PincodeRepository';
import { PincodeService } from './PincodeService';

const mockRepo = {
  findByPincode: vi.fn(),
  searchByPincode: vi.fn(),
  searchByDistrict: vi.fn(),
  searchByState: vi.fn(),
  search: vi.fn(),
  count: vi.fn(),
} as unknown as PincodeRepository;

describe('PincodeService', () => {
  let service: PincodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PincodeService(mockRepo);
  });

  it('should return pincode data if found', async () => {
    (mockRepo.findByPincode as Mock).mockResolvedValueOnce({ pincode: '111', district: 'Test' });
    const res = await service.getByPincode('111');
    expect(res.success).toBe(true);
    expect((res.data as PincodeDTO).district).toBe('Test');
  });
});
