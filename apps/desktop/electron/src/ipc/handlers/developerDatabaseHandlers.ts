import { ipcMain } from 'electron';

import { databaseExplorerService } from '../../services/developer/DatabaseExplorerService';
import { inspectorRegistry } from '../../services/developer/InspectorRegistry';
import { AccountingInspector } from '../../services/developer/inspectors/AccountingInspector';

export function registerDeveloperDatabaseHandlers() {
  inspectorRegistry.register(new AccountingInspector());

  ipcMain.handle('developer:database:listTables', async () => {
    return await databaseExplorerService.listTables();
  });

  ipcMain.handle('developer:database:getTableSchema', async (_, tableName: string) => {
    return await databaseExplorerService.getTableSchema(tableName);
  });

  ipcMain.handle('developer:database:getIndexes', async (_, tableName: string) => {
    return await databaseExplorerService.getIndexes(tableName);
  });

  ipcMain.handle('developer:database:getForeignKeys', async (_, tableName: string) => {
    return await databaseExplorerService.getForeignKeys(tableName);
  });

  ipcMain.handle(
    'developer:database:getRows',
    async (_, tableName: string, page?: number, pageSize?: number, filters?: string) => {
      return await databaseExplorerService.getRows(tableName, page, pageSize, filters);
    },
  );

  ipcMain.handle('developer:database:executeQuery', async (_, sql: string) => {
    return await databaseExplorerService.executeReadOnlyQuery(sql);
  });

  ipcMain.handle(
    'developer:database:getRelations',
    async (_, tableName: string, row: Record<string, unknown>) => {
      return await databaseExplorerService.getRelations(tableName, row);
    },
  );
}
