import {
  CreateEmployeeExpenseTypeInput,
  SearchEmployeeExpenseTypesOptions,
  UpdateEmployeeExpenseTypeInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeExpenseTypeService } from '../../services/EmployeeExpenseTypeService';

export function registerEmployeeExpenseTypeHandlers() {
  ipcMain.handle(
    'db:employeeExpenseTypes:search',
    async (_event, options: SearchEmployeeExpenseTypesOptions) => {
      try {
        const result = await employeeExpenseTypeService.search(options);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:employeeExpenseTypes:getAll', async () => {
    try {
      const result = await employeeExpenseTypeService.getAll();
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:employeeExpenseTypes:getById', async (_event, id: string) => {
    try {
      const result = await employeeExpenseTypeService.getById(id);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:employeeExpenseTypes:create',
    async (_event, data: CreateEmployeeExpenseTypeInput) => {
      try {
        const result = await employeeExpenseTypeService.create(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:employeeExpenseTypes:update',
    async (_event, id: string, data: UpdateEmployeeExpenseTypeInput) => {
      try {
        const result = await employeeExpenseTypeService.update(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:employeeExpenseTypes:delete', async (_event, id: string) => {
    try {
      await employeeExpenseTypeService.deactivate(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
