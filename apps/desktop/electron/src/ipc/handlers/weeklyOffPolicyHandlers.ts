import {
  CreateWeeklyOffPolicyInput,
  UpdateWeeklyOffPolicyInput,
  SearchWeeklyOffPoliciesOptions,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { weeklyOffPolicyService } from '../../services/WeeklyOffPolicyService';

export function registerWeeklyOffPolicyHandlers(): void {
  ipcMain.handle(
    'weeklyOffPolicies:search',
    async (event, options: SearchWeeklyOffPoliciesOptions) => {
      try {
        const result = await weeklyOffPolicyService.search(options);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('weeklyOffPolicies:getAll', async () => {
    try {
      const result = await weeklyOffPolicyService.getAll();
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('weeklyOffPolicies:getById', async (event, id: string) => {
    try {
      const result = await weeklyOffPolicyService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('weeklyOffPolicies:create', async (event, data: CreateWeeklyOffPolicyInput) => {
    try {
      const result = await weeklyOffPolicyService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'weeklyOffPolicies:update',
    async (event, id: string, data: UpdateWeeklyOffPolicyInput) => {
      try {
        const result = await weeklyOffPolicyService.update(id, data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('weeklyOffPolicies:deactivate', async (event, id: string) => {
    try {
      await weeklyOffPolicyService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
