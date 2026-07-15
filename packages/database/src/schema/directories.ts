import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const pincodeMaster = sqliteTable(
  'pincode_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pincode: text('pincode').notNull(),
    officeName: text('office_name'),
    district: text('district'),
    stateName: text('state_name'),
    regionName: text('region_name'),
    divisionName: text('division_name'),
    officeType: text('office_type'),
    deliveryStatus: text('delivery_status'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_pincode_master_pincode').on(table.pincode),
    index('idx_pincode_master_district').on(table.district),
    index('idx_pincode_master_state').on(table.stateName),
  ],
);
export const countryMaster = sqliteTable(
  'country_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    countryCode: text('country_code').notNull().unique(),
    countryCodeAlpha3: text('country_code_alpha3').notNull().unique(),
    countryName: text('country_name').notNull(),
    dialCode: text('dial_code'),
    currencyCode: text('currency_code'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_country_master_name').on(table.countryName),
    index('idx_country_master_currency').on(table.currencyCode),
  ],
);

export const currencyMaster = sqliteTable(
  'currency_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    currencyCode: text('currency_code').notNull().unique(),
    currencyName: text('currency_name').notNull(),
    symbol: text('symbol').notNull(),
    locale: text('locale').notNull().default('en-IN'),
    symbolPosition: text('symbol_position').notNull().default('PREFIX'),
    decimalPlaces: integer('decimal_places').notNull().default(2),
    isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_currency_master_name').on(table.currencyName)],
);

export const stateMaster = sqliteTable(
  'state_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    stateCode: text('state_code').notNull().unique(),
    stateName: text('state_name').notNull().unique(),
    stateType: text('state_type').notNull(),
    countryCode: text('country_code').notNull().default('IN'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_state_master_code').on(table.stateCode),
    index('idx_state_master_name').on(table.stateName),
    index('idx_state_master_country').on(table.countryCode),
  ],
);

export const uqcMaster = sqliteTable(
  'uqc_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gstUqcCode: text('gst_uqc_code').notNull().unique(),
    displayName: text('display_name').notNull(),
    uqcDescription: text('uqc_description'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_uqc_master_code').on(table.gstUqcCode),
    index('idx_uqc_master_name').on(table.displayName),
  ],
);

export const hsnMaster = sqliteTable(
  'hsn_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hsnCode: text('hsn_code').notNull().unique(),
    description: text('description').notNull(),
    codeLength: integer('code_length').notNull(),
    isInvoiceSelectable: integer('is_invoice_selectable').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_hsn_master_code').on(table.hsnCode),
    index('idx_hsn_master_selectable').on(table.isInvoiceSelectable),
  ],
);

export const sacMaster = sqliteTable(
  'sac_master',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sacCode: text('sac_code').notNull().unique(),
    description: text('description').notNull(),
    codeLength: integer('code_length').notNull(),
    isInvoiceSelectable: integer('is_invoice_selectable').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_sac_master_code').on(table.sacCode),
    index('idx_sac_master_selectable').on(table.isInvoiceSelectable),
  ],
);
