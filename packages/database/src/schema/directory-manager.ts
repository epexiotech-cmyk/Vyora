import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
