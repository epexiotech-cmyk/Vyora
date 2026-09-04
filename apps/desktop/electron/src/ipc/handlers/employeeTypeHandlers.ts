import {
  CreateEmployeeTypeInput,
  SearchEmployeeTypesOptions,
  UpdateEmployeeTypeInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeTypeService } from '../../services/EmployeeTypeService';

export function registerEmployeeTypeHandlers() {
  ipcMain.handle('db:employeeTypes:search', async (_event, options: SearchEmployeeTypesOptions) => {
    try {
      const result = await employeeTypeService.search(options);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:employeeTypes:getAll', async () => {
    try {
      const result = await employeeTypeService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:employeeTypes:getById', async (_event, id: string) => {
    try {
      const result = await employeeTypeService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:employeeTypes:create', async (_event, data: CreateEmployeeTypeInput) => {
    try {
      const result = await employeeTypeService.create(data);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:employeeTypes:update',
    async (_event, id: string, data: UpdateEmployeeTypeInput) => {
      try {
        const result = await employeeTypeService.update(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:employeeTypes:delete', async (_event, id: string) => {
    try {
      await employeeTypeService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
