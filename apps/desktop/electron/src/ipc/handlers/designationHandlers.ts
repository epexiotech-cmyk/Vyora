import {
  CreateDesignationInput,
  SearchDesignationsOptions,
  UpdateDesignationInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { designationService } from '../../services/DesignationService';

export function registerDesignationHandlers() {
  ipcMain.handle('db:designations:search', async (_event, options: SearchDesignationsOptions) => {
    try {
      const result = await designationService.search(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:designations:getAll', async () => {
    try {
      const result = await designationService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:designations:getById', async (_event, id: string) => {
    try {
      const result = await designationService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:designations:create', async (_event, data: CreateDesignationInput) => {
    try {
      const result = await designationService.create(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:designations:update',
    async (_event, id: string, data: UpdateDesignationInput) => {
      try {
        const result = await designationService.update(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:designations:delete', async (_event, id: string) => {
    try {
      await designationService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
