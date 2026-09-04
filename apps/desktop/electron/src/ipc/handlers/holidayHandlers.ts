import { CreateHolidayInput, UpdateHolidayInput, SearchHolidaysOptions } from '@vyora/types';
import { ipcMain } from 'electron';

import { holidayService } from '../../services/HolidayService';

export function registerHolidayHandlers() {
  ipcMain.handle('holidays:search', async (_, options: SearchHolidaysOptions) => {
    try {
      const result = await holidayService.search(options);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('holidays:getAll', async () => {
    try {
      const result = await holidayService.getAll();
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('holidays:getById', async (_, id: string) => {
    try {
      const result = await holidayService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('holidays:create', async (_, data: CreateHolidayInput) => {
    try {
      const result = await holidayService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('holidays:update', async (_, id: string, data: UpdateHolidayInput) => {
    try {
      const result = await holidayService.update(id, data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('holidays:deactivate', async (_, id: string) => {
    try {
      await holidayService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
