import {
  CreateEmployeeLeaveBalanceInput,
  UpdateEmployeeLeaveBalanceInput,
  SearchEmployeeLeaveBalancesOptions,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeLeaveBalanceService } from '../../services/EmployeeLeaveBalanceService';

export function registerEmployeeLeaveBalanceHandlers() {
  ipcMain.handle(
    'employee-leave-balances:search',
    async (event, options: SearchEmployeeLeaveBalancesOptions) => {
      try {
        const result = await employeeLeaveBalanceService.search(options);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('employee-leave-balances:getById', async (event, id: string) => {
    try {
      const result = await employeeLeaveBalanceService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'employee-leave-balances:create',
    async (event, data: CreateEmployeeLeaveBalanceInput) => {
      try {
        const result = await employeeLeaveBalanceService.create(data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'employee-leave-balances:update',
    async (event, id: string, data: UpdateEmployeeLeaveBalanceInput) => {
      try {
        const result = await employeeLeaveBalanceService.update(id, data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('employee-leave-balances:delete', async (event, id: string) => {
    try {
      await employeeLeaveBalanceService.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
