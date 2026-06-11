import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const directoryRegistry = sqliteTable('directory_registry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  directoryName: text('directory_name').notNull(),
  currentVersion: text('current_version').notNull(),
  recordCount: integer('record_count').notNull(),
  checksum: text('checksum').notNull(),
  activeDatabase: text('active_database').notNull(),
  lastUpdatedAt: text('last_updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const directoryUpdateLog = sqliteTable('directory_update_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  directoryName: text('directory_name').notNull(),
  oldVersion: text('old_version'),
  newVersion: text('new_version').notNull(),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const directorySettings = sqliteTable('directory_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const pincodeDynamicCache = sqliteTable(
  'pincode_dynamic_cache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pincode: text('pincode').notNull(),
    officeName: text('office_name'),
    district: text('district'),
    stateName: text('state_name'),
    regionName: text('region_name'),
    divisionName: text('division_name'),
    source: text('source').notNull(), // 'MASTER', 'API', 'MANUAL'
    lookupCount: integer('lookup_count').notNull().default(1),
    lastUsedAt: text('last_used_at').default(sql`CURRENT_TIMESTAMP`),
    lastVerifiedAt: text('last_verified_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pincodeIdx: index('idx_pincode_cache_pincode').on(table.pincode),
    lastUsedIdx: index('idx_pincode_cache_last_used').on(table.lastUsedAt),
  }),
);
