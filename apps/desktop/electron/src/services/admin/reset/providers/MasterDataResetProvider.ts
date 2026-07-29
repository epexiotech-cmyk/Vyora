import {
  products,
  customers,
  suppliers,
  units,
  taxes,
  tax_groups,
  ledgers,
  ledger_groups,
} from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class MasterDataResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Master Data';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    const getCount = (tableName: string) =>
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`)
        ?.count || 0;

    counts.products = getCount('products');
    tx.delete(products).run();

    counts.customers = getCount('customers');
    tx.delete(customers).run();

    counts.suppliers = getCount('suppliers');
    tx.delete(suppliers).run();

    counts.ledgers = getCount('ledgers');
    tx.delete(ledgers).run();

    counts.ledger_groups = getCount('ledger_groups');
    tx.delete(ledger_groups).run();

    counts.taxes = getCount('taxes');
    tx.delete(taxes).run();

    counts.tax_groups = getCount('tax_groups');
    tx.delete(tax_groups).run();

    counts.units = getCount('units');
    tx.delete(units).run();

    return counts;
  }
}
