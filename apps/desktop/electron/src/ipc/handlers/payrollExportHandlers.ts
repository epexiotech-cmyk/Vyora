import { ApiResponse, PayrollExportOptions, PayrollExportResult } from '@vyora/types';
import { ipcMain } from 'electron';

import { payrollExportService } from '../../services/PayrollExportService';

export function registerPayrollExportHandlers() {
  ipcMain.handle(
    'payroll-export:generate',
    async (_, options: PayrollExportOptions): Promise<ApiResponse<PayrollExportResult>> => {
      try {
        const result = await payrollExportService.generateExport(options);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
