import { CreateLeaveTypeInput, UpdateLeaveTypeInput, SearchLeaveTypesOptions } from '@vyora/types';
import { ipcMain } from 'electron';

import { leaveTypeService } from '../../services/LeaveTypeService';

export function registerLeaveTypeHandlers() {
  ipcMain.handle('leaveTypes:search', async (_, options: SearchLeaveTypesOptions) => {
    try {
      const result = await leaveTypeService.search(options);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leaveTypes:getAll', async () => {
    try {
      const result = await leaveTypeService.getAll();
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leaveTypes:getById', async (_, id: string) => {
    try {
      const result = await leaveTypeService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leaveTypes:create', async (_, data: CreateLeaveTypeInput) => {
    try {
      const result = await leaveTypeService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leaveTypes:update', async (_, id: string, data: UpdateLeaveTypeInput) => {
    try {
      const result = await leaveTypeService.update(id, data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leaveTypes:deactivate', async (_, id: string) => {
    try {
      await leaveTypeService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
