import { CreatePayrollSnapshotCommandDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { payrollCalculationService } from '../../services/PayrollCalculationService';
import { payrollSnapshotService } from '../../services/PayrollSnapshotService';

export function registerPayrollResultHandlers() {
  ipcMain.handle(
    'payrollSnapshot:createForPeriod',
    async (_, command: CreatePayrollSnapshotCommandDto) => {
      try {
        return await payrollSnapshotService.createForPeriod(command);
      } catch (error: unknown) {
        console.error('Error generating payroll snapshots:', error);
        throw new Error((error as Error).message || 'Failed to generate payroll snapshots');
      }
    },
  );

  ipcMain.handle('payrollResult:calculate', async (_, payrollResultId: string) => {
    try {
      return await payrollCalculationService.calculatePayrollResult(payrollResultId);
    } catch (error: unknown) {
      console.error('Error calculating payroll result:', error);
      throw new Error((error as Error).message || 'Failed to calculate payroll result');
    }
  });

  ipcMain.handle('payrollPeriod:calculate', async (_, payrollPeriodId: string) => {
    try {
      return await payrollCalculationService.calculatePeriodTransactionally(payrollPeriodId);
    } catch (error: unknown) {
      console.error('Error calculating payroll period:', error);
      throw new Error((error as Error).message || 'Failed to calculate payroll period');
    }
  });
}
