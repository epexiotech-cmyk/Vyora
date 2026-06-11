import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  legalName: text('legal_name').notNull(),
  tradeName: text('trade_name'),
  gstin: text('gstin'),
  pan: text('pan'),
  constitutionType: text('constitution_type'),
  businessType: text('business_type'),
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  district: text('district'),
  stateCode: text('state_code'),
  countryCode: text('country_code'),
  pincode: text('pincode'),
  email: text('email'),
  mobile: text('mobile'),
  telephone: text('telephone'),
  website: text('website'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
  salesSuffix: text('sales_suffix'),
  salesPadding: integer('sales_padding').default(4),
  salesStartFrom: integer('sales_start_from').default(1),
  salesResetPolicy: text('sales_reset_policy').default('YEARLY'),
  purchasePrefix: text('purchase_prefix').default('PUR'),
  purchaseSuffix: text('purchase_suffix'),
  purchasePadding: integer('purchase_padding').default(4),
  purchaseStartFrom: integer('purchase_start_from').default(1),
  purchaseResetPolicy: text('purchase_reset_policy').default('YEARLY'),
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
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  label: text('label').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
});

export const document_sequences = sqliteTable('document_sequences', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  financialYearId: text('financial_year_id').references(() => financial_years.id),
  documentType: text('document_type').notNull(),
  currentValue: integer('current_value').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export type AppSetting = typeof app_settings.$inferSelect;
export type InsertAppSetting = typeof app_settings.$inferInsert;

export type CompanySetting = typeof company_settings.$inferSelect;
export type InsertCompanySetting = typeof company_settings.$inferInsert;

export type FinancialYear = typeof financial_years.$inferSelect;
export type InsertFinancialYear = typeof financial_years.$inferInsert;

export type DocumentSequence = typeof document_sequences.$inferSelect;
export type InsertDocumentSequence = typeof document_sequences.$inferInsert;
