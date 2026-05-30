import * as schema from '@vyora/database';
import { VyoraDatabase } from '@vyora/database';
import Database from 'better-sqlite3-multiple-ciphers';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { loggerService } from '../../../services/logger/LoggerService';
import { keyManagementService } from '../../security/KeyManagementService';

import { IDatabaseAdapter } from './IDatabaseAdapter';

export class SQLCipherAdapter implements IDatabaseAdapter {
  private dbInstance: VyoraDatabase | null = null;
  private sqliteInstance: Database.Database | null = null;

  public async connect(path: string, key?: string): Promise<VyoraDatabase> {
    const finalKey = key || (await keyManagementService.ensureMasterKey());
    if (!finalKey) {
      throw new Error('Master encryption key is unavailable.');
    }

    try {
      this.sqliteInstance = new Database(path);

      this.sqliteInstance.pragma(`KEY = '${finalKey}'`);
      this.sqliteInstance.pragma('cipher_page_size = 4096');
      this.sqliteInstance.pragma('kdf_iter = 64000');
      this.sqliteInstance.pragma('cipher_hmac_algorithm = HMAC_SHA512');
      this.sqliteInstance.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');

      this.sqliteInstance.pragma('journal_mode = WAL');

      // Verify connection by reading schema version
      this.sqliteInstance.exec('PRAGMA schema_version;');

      this.dbInstance = drizzle(this.sqliteInstance as unknown as Database.Database, {
        schema,
      }) as unknown as VyoraDatabase;

      return this.dbInstance;
    } catch (err) {
      loggerService.error(`Failed to open SQLCipher database:`, err);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.dbInstance = null;
      this.sqliteInstance = null;
    }
  }

  public execute(sql: string, params: unknown[] = []): void {
    if (!this.sqliteInstance) throw new Error('Not connected');
    this.sqliteInstance.prepare(sql).run(...params);
  }

  public query(sql: string, params: unknown[] = []): unknown[] {
    if (!this.sqliteInstance) throw new Error('Not connected');
    return this.sqliteInstance.prepare(sql).all(...params);
  }

  public transaction<T>(cb: () => T): T {
    if (!this.sqliteInstance) throw new Error('Not connected');
    return this.sqliteInstance.transaction(cb)();
  }

  public getDb(): VyoraDatabase {
    if (!this.dbInstance) {
      throw new Error('Database is not initialized.');
    }
    return this.dbInstance;
  }
}
