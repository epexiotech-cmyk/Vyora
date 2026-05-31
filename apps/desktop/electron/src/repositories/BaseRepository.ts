import { VyoraDatabase } from '@vyora/database';

import { dbService } from '../services/database/DatabaseService';

export type DbTransaction = Parameters<Parameters<VyoraDatabase['transaction']>[0]>[0];
export type TransactionExecutor = VyoraDatabase | DbTransaction;

/**
 * Base repository class providing shared utilities and database access.
 * All domain-specific repositories should extend this class.
 */
export abstract class BaseRepository {
  /**
   * Protected getter to access the current database instance.
   * This delegates to DatabaseService to ensure the repository always uses
   * the active connection (handling multi-tenancy and connection lifecycle).
   */
  protected get db(): VyoraDatabase {
    return dbService.getDb();
  }
}
