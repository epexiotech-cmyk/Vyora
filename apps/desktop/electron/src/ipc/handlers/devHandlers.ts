import { ipcMain } from 'electron';

import { factoryResetService } from '../../services/admin/FactoryResetService';
import { developerToolsService } from '../../services/DeveloperToolsService';

export function registerDevHandlers() {
  ipcMain.handle('dev:diagnostics', async () => {
    try {
      const data = await developerToolsService.getDiagnostics();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('dev:factoryReset:dryRun', async () => {
    try {
      const data = await developerToolsService.dryRunFactoryReset();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('dev:factoryReset:execute', async () => {
    try {
      const data = await factoryResetService.executeFullReset();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('dev:inventory:check', async () => {
    try {
      const data = await developerToolsService.checkInventoryIntegrity();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('dev:inventory:rebuild', async () => {
    try {
      await developerToolsService.rebuildInventory();
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('dev:documentNumbering:reset', async () => {
    try {
      await developerToolsService.resetDocumentNumberingSequences();
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
