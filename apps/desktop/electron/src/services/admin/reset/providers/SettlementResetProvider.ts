import { settlements, settlement_allocations } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class SettlementResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Settlements';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    counts.settlement_allocations =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM settlement_allocations`)?.count ||
      0;
    tx.delete(settlement_allocations).run();

    counts.settlements =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM settlements`)?.count || 0;
    tx.delete(settlements).run();

    return counts;
  }
}
