import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as masterSchema from '../schema/master';
import * as systemSchema from '../schema/system';

// This function will be called by Electron Main Process, passing the DB file path
export const initializeDatabase = (dbPath: string) => {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, {
    schema: {
      ...systemSchema,
      ...masterSchema,
    },
  });

  return { db, sqlite };
};

export type VyoraDatabase = ReturnType<typeof initializeDatabase>['db'];
