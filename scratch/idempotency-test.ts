/* eslint-disable no-console */
import { inventoryAdminService } from '../apps/desktop/electron/src/services/admin/InventoryAdminService';
import { transactionResetService } from '../apps/desktop/electron/src/services/admin/TransactionResetService';
import { dbService } from '../apps/desktop/electron/src/services/database/DatabaseService';
import { directoryManagerDatabaseService } from '../apps/desktop/electron/src/services/database/DirectoryManagerDatabaseService';
import { loggerService } from '../apps/desktop/electron/src/services/logger/LoggerService';

async function run() {
  loggerService.init();
  await dbService.init();
  await directoryManagerDatabaseService.bootDirectoryDatabase();

  console.log('--- RUNNING RESET TRANSACTIONS 1 ---');
  await transactionResetService.hardResetAllSync();
  console.log('--- RUNNING RESET TRANSACTIONS 2 ---');
  await transactionResetService.hardResetAllSync();

  console.log('--- RUNNING REBUILD INVENTORY 1 ---');
  await inventoryAdminService.rebuildInventorySync();
  console.log('--- RUNNING REBUILD INVENTORY 2 ---');
  await inventoryAdminService.rebuildInventorySync();

  console.log('--- RUNNING CHECK INVENTORY 1 ---');
  const m1 = await inventoryAdminService.checkInventoryIntegritySync();
  console.log('Mismatches:', m1.length);

  console.log('--- RUNNING CHECK INVENTORY 2 ---');
  const m2 = await inventoryAdminService.checkInventoryIntegritySync();
  console.log('Mismatches:', m2.length);

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
