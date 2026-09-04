import {
  CreateDepartmentInput,
  SearchDepartmentsOptions,
  UpdateDepartmentInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { departmentService } from '../../services/DepartmentService';

export function registerDepartmentHandlers() {
  ipcMain.handle('db:departments:search', async (_event, options: SearchDepartmentsOptions) => {
    try {
      const result = await departmentService.search(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:departments:getAll', async () => {
    try {
      const result = await departmentService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:departments:getById', async (_event, id: string) => {
    try {
      const result = await departmentService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:departments:create', async (_event, data: CreateDepartmentInput) => {
    try {
      const result = await departmentService.create(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:departments:update',
    async (_event, id: string, data: UpdateDepartmentInput) => {
      try {
        const result = await departmentService.update(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:departments:delete', async (_event, id: string) => {
    try {
      await departmentService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
