import * as fs from 'fs';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { directoryDatabaseService } from './DirectoryDatabaseService';
import { directoryManagerDatabaseService } from './DirectoryManagerDatabaseService';
import { directorySwapService } from './DirectorySwapService';

vi.mock('fs');
vi.mock('better-sqlite3');
vi.mock('electron', () => ({
  app: { isPackaged: false },
}));

vi.mock('../logger/LoggerService', () => ({
  loggerService: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const mocks = vi.hoisted(() => ({
  mockPrepareGet: vi.fn(),
}));

vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      prepare = vi.fn(() => ({
        get: mocks.mockPrepareGet,
      }));
      close = vi.fn();
    },
  };
});

vi.mock('./DirectoryManagerDatabaseService', () => ({
  directoryManagerDatabaseService: {
    getActiveDirectoryDatabase: vi.fn(),
    setActiveDirectoryDatabase: vi.fn(),
    getLastKnownGoodDatabase: vi.fn(),
    setLastKnownGoodDatabase: vi.fn(),
  },
}));

vi.mock('./DirectoryDatabaseService', () => ({
  directoryDatabaseService: {
    reload: vi.fn(),
  },
}));

describe('DirectorySwapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCandidateDatabase', () => {
    it('should return false if file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = await directorySwapService.validateCandidateDatabase('bad.db');
      expect(result).toBe(false);
    });

    it('should return false if table check fails', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      mocks.mockPrepareGet.mockReturnValueOnce(undefined); // missing table
      const result = await directorySwapService.validateCandidateDatabase('good.db');
      expect(result).toBe(false);
    });

    it('should return true if validation passes', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      mocks.mockPrepareGet.mockReturnValueOnce({ name: 'pincode_master' }); // table exists
      mocks.mockPrepareGet.mockReturnValueOnce({ 1: 1 }); // query succeeds
      const result = await directorySwapService.validateCandidateDatabase('good.db');
      if (!result) {
        const { loggerService } = await import('../logger/LoggerService');
        console.log(vi.mocked(loggerService.error).mock.calls);
      }
      expect(result).toBe(true);
    });
  });

  describe('swap', () => {
    it('should abort if validation fails', async () => {
      vi.spyOn(directorySwapService, 'validateCandidateDatabase').mockResolvedValue(false);
      const result = await directorySwapService.swap('v2.db');
      expect(result).toBe(false);
      expect(directoryManagerDatabaseService.setActiveDirectoryDatabase).not.toHaveBeenCalled();
    });

    it('should update pointers and reload on success', async () => {
      vi.spyOn(directorySwapService, 'validateCandidateDatabase').mockResolvedValue(true);
      vi.mocked(directoryManagerDatabaseService.getActiveDirectoryDatabase).mockResolvedValue(
        'v1.db',
      );

      const result = await directorySwapService.swap('v2.db');

      expect(result).toBe(true);
      expect(directoryManagerDatabaseService.setLastKnownGoodDatabase).toHaveBeenCalledWith(
        'v1.db',
      );
      expect(directoryManagerDatabaseService.setActiveDirectoryDatabase).toHaveBeenCalledWith(
        'v2.db',
      );
      expect(directoryDatabaseService.reload).toHaveBeenCalled();
    });
  });

  describe('rollback', () => {
    it('should abort if no last known good db', async () => {
      vi.mocked(directoryManagerDatabaseService.getLastKnownGoodDatabase).mockResolvedValue(null);
      const result = await directorySwapService.rollback();
      expect(result).toBe(false);
    });

    it('should abort if last known good db file is missing', async () => {
      vi.mocked(directoryManagerDatabaseService.getLastKnownGoodDatabase).mockResolvedValue(
        'v1.db',
      );
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = await directorySwapService.rollback();
      expect(result).toBe(false);
    });

    it('should restore pointer and reload on success', async () => {
      vi.mocked(directoryManagerDatabaseService.getLastKnownGoodDatabase).mockResolvedValue(
        'v1.db',
      );
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await directorySwapService.rollback();

      expect(result).toBe(true);
      expect(directoryManagerDatabaseService.setActiveDirectoryDatabase).toHaveBeenCalledWith(
        'v1.db',
      );
      expect(directoryDatabaseService.reload).toHaveBeenCalled();
    });
  });
});
