import { vouchers, voucher_entries } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class AccountingResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Accounting';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const entriesCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM voucher_entries`)?.count || 0;
    tx.delete(voucher_entries).run();

    const vouchersCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM vouchers`)?.count || 0;
    tx.delete(vouchers).run();

    return {
      voucher_entries: entriesCount,
      vouchers: vouchersCount,
    };
  }
}
