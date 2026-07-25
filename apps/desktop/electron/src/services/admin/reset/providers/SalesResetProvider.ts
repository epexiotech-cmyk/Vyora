import { sales_invoices, sales_invoice_items } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class SalesResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Sales';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const itemsCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM sales_invoice_items`)?.count || 0;
    tx.delete(sales_invoice_items).run();

    const invoicesCount =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM sales_invoices`)?.count || 0;
    tx.delete(sales_invoices).run();

    return {
      sales_invoice_items: itemsCount,
      sales_invoices: invoicesCount,
    };
  }
}
