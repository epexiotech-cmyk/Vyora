import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const states = sqliteTable('states', {
  id: text('id').primaryKey(),
  gstStateCode: text('gst_state_code').notNull().unique(),
  isoCode: text('iso_code').notNull(),
  name: text('name').notNull(),
  isUnionTerritory: integer('is_union_territory', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

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
  stateCode: text('state_code'), // backward compatibility
  gstStateId: text('gst_state_id').references(() => states.id),
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
  defaultInvoiceNotes: text('default_invoice_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const document_numbering_configs = sqliteTable('document_numbering_configs', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id),
  documentType: text('document_type').notNull(),
  prefix: text('prefix'),
  formatTemplate: text('format_template').notNull().default('{{PREFIX}}-{{FY}}-{{SEQ}}'),
  fyFormat: text('fy_format').notNull().default('YY-YY'),
  startingNumber: integer('starting_number').notNull().default(1),
  zeroPadding: integer('zero_padding').notNull().default(4),
  resetYearly: integer('reset_yearly', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email'),
  avatar: text('avatar'),
  passwordHash: text('password_hash').notNull(),
  pinHash: text('pin_hash'),
  pinLength: integer('pin_length'),
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const user_settings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  lastActiveCompanyId: text('last_active_company_id').references(() => companies.id),
  startupPreference: text('startup_preference').default('last_company'),
  theme: text('theme').default('system'),
  language: text('language').default('en'),
  dateFormat: text('date_format').default('DD/MM/YYYY'),
  rememberSession: integer('remember_session', { mode: 'boolean' }).default(true).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  tokenHash: text('token_hash').notNull(),
  deviceName: text('device_name'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  theme: text('theme').default('dark').notNull(),
  defaultCompanyId: text('default_company_id').references(() => companies.id),
  backupEnabled: integer('backup_enabled', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const financial_years = sqliteTable(
  'financial_years',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    label: text('label').notNull(),
    startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
    endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
  },
  (table) => {
    return {
      activeFinancialYearIdx: uniqueIndex('active_financial_year_idx')
        .on(table.companyId)
        .where(sql`"is_active" = 1`),
    };
  },
);

export const document_numbering_sequences = sqliteTable(
  'document_numbering_sequences',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    documentType: text('document_type').notNull(),
    financialYearId: text('financial_year_id').references(() => financial_years.id),
    currentSequence: integer('current_sequence').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => {
    return {
      docNumberingSeqIdx: uniqueIndex('doc_numbering_seq_idx').on(
        table.companyId,
        table.documentType,
        table.financialYearId,
      ),
    };
  },
);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export type AppSetting = typeof app_settings.$inferSelect;
export type InsertAppSetting = typeof app_settings.$inferInsert;

export type CompanySetting = typeof company_settings.$inferSelect;
export type InsertCompanySetting = typeof company_settings.$inferInsert;

export type FinancialYear = typeof financial_years.$inferSelect;
export type InsertFinancialYear = typeof financial_years.$inferInsert;

export type DocumentNumberingConfig = typeof document_numbering_configs.$inferSelect;
export type InsertDocumentNumberingConfig = typeof document_numbering_configs.$inferInsert;

export type DocumentNumberingSequence = typeof document_numbering_sequences.$inferSelect;
export type InsertDocumentNumberingSequence = typeof document_numbering_sequences.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserSetting = typeof user_settings.$inferSelect;
export type InsertUserSetting = typeof user_settings.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
