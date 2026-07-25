import { inventory_balances, stock_movements } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class InventoryResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Inventory';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const movementsCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM stock_movements`)?.count || 0;
    tx.delete(stock_movements).run();

    const balancesCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM inventory_balances`)?.count || 0;
    tx.delete(inventory_balances).run();

    return {
      stock_movements: movementsCount,
      inventory_balances: balancesCount,
    };
  }
}
