import { DbTransaction } from '../../../main/database/adapters/IDatabaseAdapter';

export interface IResetProvider {
  /**
   * Identifies the business domain this provider resets.
   */
  getDomainName(): string;

  /**
   * Performs the deletion of data and returns a map of table names and the
   * number of rows deleted. This must NOT commit the transaction itself.
   */
  reset(tx: DbTransaction): Record<string, number>;
}
