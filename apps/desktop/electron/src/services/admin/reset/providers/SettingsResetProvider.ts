import { settings, company_settings, app_settings } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class SettingsResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Settings';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    counts.company_settings =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM company_settings`)?.count || 0;
    tx.delete(company_settings).run();

    counts.app_settings =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM app_settings`)?.count || 0;
    tx.delete(app_settings).run();

    counts.settings =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM settings`)?.count || 0;
    tx.delete(settings).run();

    return counts;
  }
}
