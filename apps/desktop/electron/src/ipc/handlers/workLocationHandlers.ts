import {
  CreateWorkLocationInput,
  SearchWorkLocationsOptions,
  UpdateWorkLocationInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { workLocationService } from '../../services/WorkLocationService';

export function registerWorkLocationHandlers() {
  ipcMain.handle('db:workLocations:search', async (_event, options: SearchWorkLocationsOptions) => {
    try {
      const result = await workLocationService.search(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:workLocations:getAll', async () => {
    try {
      const result = await workLocationService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:workLocations:getById', async (_event, id: string) => {
    try {
      const result = await workLocationService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:workLocations:create', async (_event, data: CreateWorkLocationInput) => {
    try {
      const result = await workLocationService.create(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:workLocations:update',
    async (_event, id: string, data: UpdateWorkLocationInput) => {
      try {
        const result = await workLocationService.update(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:workLocations:delete', async (_event, id: string) => {
    try {
      await workLocationService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
