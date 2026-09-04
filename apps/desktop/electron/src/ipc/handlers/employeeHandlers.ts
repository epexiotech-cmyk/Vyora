import {
  SearchEmployeesOptionsSchema,
  CreateEmployeeInputSchema,
  UpdateEmployeeInputSchema,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeService } from '../../services/EmployeeService';

export function registerEmployeeHandlers() {
  ipcMain.handle('employee:search', async (_, options) => {
    try {
      const parsedOptions = SearchEmployeesOptionsSchema.parse(options);
      const result = await employeeService.search(parsedOptions);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employee:getById', async (_, id: string) => {
    try {
      const result = await employeeService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employee:create', async (_, data) => {
    try {
      const parsedData = CreateEmployeeInputSchema.parse(data);
      const result = await employeeService.create(parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employee:update', async (_, id: string, data) => {
    try {
      const parsedData = UpdateEmployeeInputSchema.parse(data);
      const result = await employeeService.update(id, parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employee:deactivate', async (_, id: string) => {
    try {
      await employeeService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
