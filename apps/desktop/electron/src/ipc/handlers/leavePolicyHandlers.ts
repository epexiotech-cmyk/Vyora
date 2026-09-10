import {
  CreateLeavePolicyInput,
  UpdateLeavePolicyInput,
  SearchLeavePoliciesOptions,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { leavePolicyService } from '../../services/LeavePolicyService';

export function registerLeavePolicyHandlers(): void {
  ipcMain.handle('leavePolicies:search', async (event, options: SearchLeavePoliciesOptions) => {
    try {
      const result = await leavePolicyService.search(options);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leavePolicies:getAll', async () => {
    try {
      const result = await leavePolicyService.getAll();
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leavePolicies:getById', async (event, id: string) => {
    try {
      const result = await leavePolicyService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leavePolicies:create', async (event, data: CreateLeavePolicyInput) => {
    try {
      const result = await leavePolicyService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'leavePolicies:update',
    async (event, id: string, data: UpdateLeavePolicyInput) => {
      try {
        const result = await leavePolicyService.update(id, data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('leavePolicies:deactivate', async (event, id: string) => {
    try {
      await leavePolicyService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
