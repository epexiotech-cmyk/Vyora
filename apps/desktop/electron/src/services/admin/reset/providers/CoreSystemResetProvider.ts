import { companies, company_settings, app_settings, financial_years } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class CoreSystemResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Core System';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    const getCount = (tableName: string) =>
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`)
        ?.count || 0;

    counts.financial_years = getCount('financial_years');
    tx.delete(financial_years).run();

    counts.company_settings = getCount('company_settings');
    tx.delete(company_settings).run();

    counts.app_settings = getCount('app_settings');
    tx.delete(app_settings).run();

    counts.companies = getCount('companies');
    tx.delete(companies).run();

    return counts;
  }
}
