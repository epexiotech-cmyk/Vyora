import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class PurchasesResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Purchases';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const itemsCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM purchase_invoice_items`)?.count ||
      0;
    tx.delete(purchase_invoice_items).run();

    const invoicesCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM purchase_invoices`)?.count || 0;
    tx.delete(purchase_invoices).run();

    return {
      purchase_invoice_items: itemsCount,
      purchase_invoices: invoicesCount,
    };
  }
}
