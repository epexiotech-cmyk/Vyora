import { CreatePayrollPeriodDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { payrollPeriodService } from '../../services/PayrollPeriodService';

export const registerPayrollPeriodHandlers = () => {
  ipcMain.handle('payroll-periods:list', async () => {
    return payrollPeriodService.listPeriods();
  });

  ipcMain.handle('payroll-periods:get', async (_, id: string) => {
    return payrollPeriodService.getPeriod(id);
  });

  ipcMain.handle('payroll-periods:create', async (_, data: CreatePayrollPeriodDto) => {
    return payrollPeriodService.createPeriod(data);
  });

  ipcMain.handle('payroll-periods:lock', async (_, id: string) => {
    return payrollPeriodService.lockPeriod(id);
  });

  ipcMain.handle('payroll-periods:unlock', async (_, id: string) => {
    return payrollPeriodService.unlockPeriod(id);
  });
};
