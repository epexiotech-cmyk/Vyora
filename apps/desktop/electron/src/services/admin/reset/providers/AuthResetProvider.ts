import { sessions, user_settings, users } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class AuthResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Authentication';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    const getCount = (tableName: string) =>
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`)
        ?.count || 0;

    counts.sessions = getCount('sessions');
    tx.delete(sessions).run();

    counts.user_settings = getCount('user_settings');
    tx.delete(user_settings).run();

    counts.users = getCount('users');
    tx.delete(users).run();

    return counts;
  }
}
