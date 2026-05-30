import { initializeDatabase, VyoraDatabase } from '@vyora/database';

import { IDatabaseAdapter } from './IDatabaseAdapter';

export class SQLiteAdapter implements IDatabaseAdapter {
  private dbInstance: VyoraDatabase | null = null;
  private sqliteInstance: ReturnType<typeof initializeDatabase>['sqlite'] | null = null;

  public async connect(path: string, _key?: string): Promise<VyoraDatabase> {
    const { db, sqlite } = initializeDatabase(path);
    this.dbInstance = db;
    this.sqliteInstance = sqlite;
    return db;
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
      throw new Error('Database is not connected');
    }
    return this.dbInstance;
  }
}
