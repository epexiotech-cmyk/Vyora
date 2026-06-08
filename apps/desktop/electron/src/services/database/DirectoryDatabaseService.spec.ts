import * as fs from 'fs';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DirectoryDatabaseService } from './DirectoryDatabaseService';

vi.mock('fs');
vi.mock('better-sqlite3');
vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: vi.fn(() => ({})),
}));
vi.mock('../logger/LoggerService', () => ({
  loggerService: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('DirectoryDatabaseService', () => {
  let service: DirectoryDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DirectoryDatabaseService();
  });

  it('should throw error if getting db before connect', () => {
    expect(() => service.getDb()).toThrow('Database not connected. Call connect() first.');
  });

  it('should throw error if db path does not exist', () => {
    (fs.existsSync as import('vitest').Mock).mockReturnValue(false);
    expect(() => service.connect('bad/path.db')).toThrow('Database missing at bad/path.db');
  });

  it('should connect and set current path', () => {
    (fs.existsSync as import('vitest').Mock).mockReturnValue(true);
    service.connect('good/path.db');
    expect(service.getCurrentDatabasePath()).toBe('good/path.db');
    expect(service.getDb()).toBeDefined();
  });

  it('should close connection', () => {
    (fs.existsSync as import('vitest').Mock).mockReturnValue(true);
    service.connect('good/path.db');
    service.close();
    expect(service.getCurrentDatabasePath()).toBeNull();
    expect(() => service.getDb()).toThrow();
  });
});
