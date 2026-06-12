import { CreateUnitInput, SearchUnitsOptions, UpdateUnitInput } from '@vyora/types';
import { ipcMain } from 'electron';

import { unitService } from '../../services/UnitService';

export function registerUnitHandlers() {
  ipcMain.handle('db:units:search', async (_event, options: SearchUnitsOptions) => {
    try {
      const result = await unitService.search(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:units:getAll', async () => {
    try {
      const result = await unitService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:units:getById', async (_event, id: string) => {
    try {
      const result = await unitService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:units:create', async (_event, data: CreateUnitInput) => {
    try {
      const result = await unitService.create(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:units:update', async (_event, id: string, data: UpdateUnitInput) => {
    try {
      const result = await unitService.update(id, data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:units:delete', async (_event, id: string) => {
    try {
      await unitService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
