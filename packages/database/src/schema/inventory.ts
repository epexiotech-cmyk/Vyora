import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { products } from './master';
import { companies, financial_years } from './system';

export const stock_movements = sqliteTable(
  'stock_movements',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    productId: text('product_id')
      .references(() => products.id)
      .notNull(),
    movementType: text('movement_type').notNull(),
    referenceType: text('reference_type').notNull(),
    referenceId: text('reference_id').notNull(),
    quantityIn: integer('quantity_in').default(0).notNull(),
    quantityOut: integer('quantity_out').default(0).notNull(),
    rate: integer('rate').default(0).notNull(),
    movementDate: integer('movement_date', { mode: 'timestamp' }).notNull(),
    remarks: text('remarks'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('stock_movements_product_idx').on(table.productId),
    index('stock_movements_date_idx').on(table.movementDate),
    index('stock_movements_product_date_idx').on(table.productId, table.movementDate),
  ],
);

export const inventory_balances = sqliteTable(
  'inventory_balances',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    productId: text('product_id')
      .references(() => products.id)
      .notNull(),
    currentQty: integer('current_qty').default(0).notNull(),
    currentWacPaise: integer('current_wac_paise').default(0).notNull(),
    currentValuePaise: integer('current_value_paise').default(0).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    uniqueIndex('inventory_balances_unique_idx').on(
      table.companyId,
      table.financialYearId,
      table.productId,
    ),
    index('inventory_balances_product_idx').on(table.productId),
  ],
);
