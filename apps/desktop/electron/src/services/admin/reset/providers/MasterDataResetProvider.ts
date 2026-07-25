import {
  products,
  customers,
  suppliers,
  units,
  taxes,
  ledgers,
  ledger_groups,
} from '@vyora/database';
import { GST_RATES } from '@vyora/types';
import { GST_UQC_MASTER } from '@vyora/utils';
import { sql, eq, notInArray } from 'drizzle-orm';

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

    counts.custom_ledgers =
      tx
        .select({ count: sql<number>`count(*)` })
        .from(ledgers)
        .where(eq(ledgers.isSystemAccount, false))
        .get()?.count || 0;
    tx.delete(ledgers).where(eq(ledgers.isSystemAccount, false)).run();

    counts.custom_ledger_groups =
      tx
        .select({ count: sql<number>`count(*)` })
        .from(ledger_groups)
        .where(eq(ledger_groups.isSystemGroup, false))
        .get()?.count || 0;
    tx.delete(ledger_groups).where(eq(ledger_groups.isSystemGroup, false)).run();

    // Do not delete system taxes
    const systemTaxNames = GST_RATES.map((t) => t.name);
    counts.custom_taxes =
      tx
        .select({ count: sql<number>`count(*)` })
        .from(taxes)
        .where(notInArray(taxes.name, systemTaxNames))
        .get()?.count || 0;
    tx.delete(taxes).where(notInArray(taxes.name, systemTaxNames)).run();

    // Do not delete system units
    const systemUnitNames = GST_UQC_MASTER.flatMap((category) => category.units.map((u) => u.name));
    counts.custom_units =
      tx
        .select({ count: sql<number>`count(*)` })
        .from(units)
        .where(notInArray(units.name, systemUnitNames))
        .get()?.count || 0;
    tx.delete(units).where(notInArray(units.name, systemUnitNames)).run();

    return counts;
  }
}
