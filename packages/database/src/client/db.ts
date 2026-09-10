import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as accountingSchema from '../schema/accounting';
import * as directoriesSchema from '../schema/directories';
import * as directoryManagerSchema from '../schema/directory-manager';
import * as employeeSchema from '../schema/employee';
import * as inventorySchema from '../schema/inventory';
import * as masterSchema from '../schema/master';
import * as paymentAccountsSchema from '../schema/paymentAccounts';
import * as payrollSchema from '../schema/payroll';
import * as purchasesSchema from '../schema/purchases';
import * as salesSchema from '../schema/sales';
import * as systemSchema from '../schema/system';

// This function will be called by Electron Main Process, passing the DB file path
export const initializeDatabase = (dbPath: string) => {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, {
    schema: {
      ...systemSchema,
      ...masterSchema,
      ...accountingSchema,
      ...directoriesSchema,
      ...directoryManagerSchema,
      ...employeeSchema,
      ...inventorySchema,
      ...paymentAccountsSchema,
      ...purchasesSchema,
      ...salesSchema,
      ...payrollSchema,
    },
  });

  return { db, sqlite };
};

export type VyoraDatabase = ReturnType<typeof initializeDatabase>['db'];
