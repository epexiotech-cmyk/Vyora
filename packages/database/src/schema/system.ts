import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  gstin: text('gstin'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const app_settings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const company_settings = sqliteTable('company_settings', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  financialYearStart: integer('financial_year_start', { mode: 'timestamp' }),
  currency: text('currency').default('INR').notNull(),
  isGstRegistered: integer('is_gst_registered', { mode: 'boolean' }).default(false).notNull(),
  salesPrefix: text('sales_prefix').default('INV'),
  purchasePrefix: text('purchase_prefix').default('PUR'),
  defaultInvoiceNotes: text('default_invoice_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  theme: text('theme').default('dark').notNull(),
  defaultCompanyId: text('default_company_id').references(() => companies.id),
  backupEnabled: integer('backup_enabled', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const financial_years = sqliteTable('financial_years', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export type AppSetting = typeof app_settings.$inferSelect;
export type InsertAppSetting = typeof app_settings.$inferInsert;

export type CompanySetting = typeof company_settings.$inferSelect;
export type InsertCompanySetting = typeof company_settings.$inferInsert;
