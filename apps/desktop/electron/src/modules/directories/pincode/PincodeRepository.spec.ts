import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PincodeRepository } from './PincodeRepository';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn(),
  all: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn(),
};

vi.mock('../../../repositories/BaseRepository', () => ({
  BaseRepository: class {
    protected get db() {
      return mockDb;
    }
  },
}));

describe('PincodeRepository', () => {
  let repo: PincodeRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PincodeRepository();
  });

  it('should find by pincode', async () => {
    mockDb.get.mockResolvedValueOnce({ pincode: '504273' });
    const result = await repo.findByPincode('504273');
    expect(result).toEqual({ pincode: '504273' });
  });
});
