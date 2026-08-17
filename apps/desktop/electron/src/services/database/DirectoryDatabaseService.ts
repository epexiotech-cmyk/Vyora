import * as fs from 'fs';

import { VyoraDatabase } from '@vyora/database';
import Database from 'better-sqlite3-multiple-ciphers';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { loggerService } from '../logger/LoggerService';

class AsyncReadWriteMutex {
  private activeReaders = 0;
  private writeQueue: (() => void)[] = [];
  private isWriting = false;
  private readQueue: (() => void)[] = [];

  async acquireRead(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => {
        this.activeReaders++;
        resolve(() => this.releaseRead());
      };

      if (this.isWriting || this.writeQueue.length > 0) {
        this.readQueue.push(grant);
      } else {
        grant();
      }
    });
  }

  async acquireWrite(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => {
        this.isWriting = true;
        resolve(() => this.releaseWrite());
      };

      if (this.isWriting || this.activeReaders > 0) {
        this.writeQueue.push(grant);
      } else {
        grant();
      }
    });
  }

  private releaseRead() {
    this.activeReaders--;
    this.processQueue();
  }

  private releaseWrite() {
    this.isWriting = false;
    this.processQueue();
  }

  private processQueue() {
    if (this.isWriting) return;

    if (this.writeQueue.length > 0 && this.activeReaders === 0) {
      const nextWrite = this.writeQueue.shift();
      if (nextWrite) nextWrite();
    } else if (this.writeQueue.length === 0 && this.readQueue.length > 0) {
      const pendingReads = [...this.readQueue];
      this.readQueue = [];
      pendingReads.forEach((grant) => grant());
    }
  }
}

export class DirectoryDatabaseService {
  private dbInstance: VyoraDatabase | null = null;
  private sqliteInstance: Database.Database | null = null;
  private currentDbPath: string | null = null;
  private mutex = new AsyncReadWriteMutex();

  constructor() {}

  public connect(dbPath: string): void {
    if (this.dbInstance && this.currentDbPath === dbPath) return;

    if (this.sqliteInstance) {
      this.close();
    }

    loggerService.info(`[DirectoryDatabaseService] Connecting to directory database at ${dbPath}`);

    try {
      if (!fs.existsSync(dbPath)) {
        loggerService.error(`[DirectoryDatabaseService] Database not found at ${dbPath}`);
        throw new Error(`Database missing at ${dbPath}`);
      }

      this.sqliteInstance = new Database(dbPath, { readonly: true });
      this.dbInstance = drizzle(this.sqliteInstance) as unknown as VyoraDatabase;
      this.currentDbPath = dbPath;

      loggerService.info(`[DirectoryDatabaseService] Connection established.`);
    } catch (error) {
      loggerService.error('[DirectoryDatabaseService] Connection failed:', error);
      throw error;
    }
  }

  public getDb(): VyoraDatabase {
    if (!this.dbInstance) {
      throw new Error('[DirectoryDatabaseService] Database not connected. Call connect() first.');
    }
    return this.dbInstance;
  }

  public async execute<T>(cb: (db: VyoraDatabase) => Promise<T>): Promise<T> {
    const release = await this.mutex.acquireRead();
    try {
      const db = this.getDb();
      return await cb(db);
    } finally {
      release();
    }
  }

  public close(): void {
    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.sqliteInstance = null;
      this.dbInstance = null;
      this.currentDbPath = null;
      loggerService.info(`[DirectoryDatabaseService] Connection closed.`);
    }
  }

  public getCurrentDatabasePath(): string | null {
    return this.currentDbPath;
  }

  public async reload(dbPath: string): Promise<void> {
    const release = await this.mutex.acquireWrite();
    try {
      this.connect(dbPath);
    } finally {
      release();
    }
  }
}

export const directoryDatabaseService = new DirectoryDatabaseService();
