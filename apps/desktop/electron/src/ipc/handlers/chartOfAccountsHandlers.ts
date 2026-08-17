import {
  CreateLedgerGroupInput,
  SearchLedgerGroupsOptions,
  UpdateLedgerGroupInput,
  SearchLedgersOptions,
  CreateLedgerInput,
  UpdateLedgerInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { chartOfAccountsService } from '../../services/ChartOfAccountsService';

export function registerChartOfAccountsHandlers() {
  ipcMain.handle(
    'db:accounting:groups:search',
    async (_event, options: SearchLedgerGroupsOptions) => {
      try {
        const result = await chartOfAccountsService.searchGroups(options);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:accounting:groups:getAll', async () => {
    try {
      const result = await chartOfAccountsService.getAllGroups();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:accounting:groups:getById', async (_event, id: string) => {
    try {
      const result = await chartOfAccountsService.getGroupById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:accounting:groups:create', async (_event, data: CreateLedgerGroupInput) => {
    try {
      const result = await chartOfAccountsService.createGroup(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:accounting:groups:update',
    async (_event, id: string, data: UpdateLedgerGroupInput) => {
      try {
        const result = await chartOfAccountsService.updateGroup(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:accounting:groups:delete', async (_event, id: string) => {
    try {
      await chartOfAccountsService.deactivateGroup(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ============================================================================
  // LEDGERS
  // ============================================================================

  ipcMain.handle('db:accounting:ledgers:search', async (_event, options: SearchLedgersOptions) => {
    try {
      const result = await chartOfAccountsService.searchLedgers(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:accounting:ledgers:getById', async (_event, id: string) => {
    try {
      const result = await chartOfAccountsService.getLedgerById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:accounting:ledgers:create', async (_event, data: CreateLedgerInput) => {
    try {
      const result = await chartOfAccountsService.createLedger(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:accounting:ledgers:update',
    async (_event, id: string, data: UpdateLedgerInput) => {
      try {
        const result = await chartOfAccountsService.updateLedger(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:accounting:ledgers:delete', async (_event, id: string) => {
    try {
      await chartOfAccountsService.deactivateLedger(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
