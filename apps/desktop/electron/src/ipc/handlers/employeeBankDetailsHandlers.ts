import {
  CreateEmployeeBankDetailInputSchema,
  UpdateEmployeeBankDetailInputSchema,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeBankDetailsService } from '../../services/EmployeeBankDetailsService';

export function registerEmployeeBankDetailsHandlers() {
  ipcMain.handle('employeeBankDetails:getByEmployeeId', async (_, employeeId: string) => {
    try {
      const result = await employeeBankDetailsService.getByEmployeeId(employeeId);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeBankDetails:getById', async (_, id: string) => {
    try {
      const result = await employeeBankDetailsService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeBankDetails:create', async (_, employeeId: string, data) => {
    try {
      const parsedData = CreateEmployeeBankDetailInputSchema.parse(data);
      const result = await employeeBankDetailsService.create(employeeId, parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeBankDetails:update', async (_, id: string, data) => {
    try {
      const parsedData = UpdateEmployeeBankDetailInputSchema.parse(data);
      const result = await employeeBankDetailsService.update(id, parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeBankDetails:deactivate', async (_, id: string) => {
    try {
      await employeeBankDetailsService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
