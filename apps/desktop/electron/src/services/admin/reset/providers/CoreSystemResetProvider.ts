import { companies, financial_years } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { loggerService } from '../../../logger/LoggerService';
import { IResetProvider } from '../IResetProvider';

export class CoreSystemResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Core System';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    const getCount = (tableName: string) => {
      try {
        loggerService.info(`[CoreSystem] Query count for ${tableName}`);
        const result =
          tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`)
            ?.count || 0;
        loggerService.info(`[CoreSystem] Query count for ${tableName} Complete: ${result}`);
        return result;
      } catch (err: unknown) {
        const error = err as Error;
        loggerService.error(
          `[CoreSystem] Error getting count for ${tableName}`,
          error,
          error?.stack,
        );
        throw error;
      }
    };

    try {
      loggerService.info('[CoreSystem] Delete financial_years');
      counts.financial_years = getCount('financial_years');
      tx.delete(financial_years).run();
      loggerService.info('[CoreSystem] Delete financial_years Complete');
    } catch (err: unknown) {
      const error = err as Error;
      loggerService.error('[CoreSystem] Error deleting financial_years', error, error?.stack);
      throw error;
    }

    try {
      loggerService.info('[CoreSystem] Delete companies');
      counts.companies = getCount('companies');
      tx.delete(companies).run();
      loggerService.info('[CoreSystem] Delete companies Complete');
    } catch (err: unknown) {
      const error = err as Error;
      loggerService.error('[CoreSystem] Error deleting companies', error, error?.stack);
      throw error;
    }

    return counts;
  }
}
