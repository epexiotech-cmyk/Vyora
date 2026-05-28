import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

import { companies } from './system';

export const taxes = sqliteTable('taxes', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  rate: real('rate').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  gstin: text('gstin'),
  mobile: text('mobile'),
  email: text('email'),
  city: text('city'),
  state: text('state'),
  balance: real('balance').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  gstin: text('gstin'),
  mobile: text('mobile'),
  email: text('email'),
  city: text('city'),
  state: text('state'),
  balance: real('balance').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  sku: text('sku'),
  hsnCode: text('hsn_code'),
  unitId: text('unit_id').references(() => units.id),
  taxId: text('tax_id').references(() => taxes.id),
  salePrice: real('sale_price').default(0).notNull(),
  purchasePrice: real('purchase_price').default(0).notNull(),
  stock: real('stock').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
