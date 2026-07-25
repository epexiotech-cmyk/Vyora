import { VyoraDatabase } from '@vyora/database';

export type DbTransaction = Parameters<Parameters<VyoraDatabase['transaction']>[0]>[0];

export interface IDatabaseAdapter {
  connect(path: string, key?: string): Promise<VyoraDatabase>;
  disconnect(): Promise<void>;
  execute(sql: string, params?: unknown[]): void;
  query(sql: string, params?: unknown[]): unknown[];
  transaction<T>(cb: () => T): T;
  getDb(): VyoraDatabase;
}
