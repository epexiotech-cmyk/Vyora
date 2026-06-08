import { ApiResponse, FinancialYearDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';
import { financialYearContextService } from '../../services/FinancialYearContextService';
import { financialYearService } from '../../services/FinancialYearService';

export function registerFinancialYearHandlers() {
  ipcMain.handle(
    'financial-year:get-current',
    async (): Promise<ApiResponse<FinancialYearDto | null>> => {
      try {
        const activeCompanyId = companyContextService.getActiveCompany();
        if (!activeCompanyId) {
          return { success: false, error: 'No active company found.' };
        }

        const fy = financialYearContextService.getActiveFinancialYear();
        return { success: true, data: fy };
      } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'financial-year:get-active',
    async (_, companyId: string): Promise<ApiResponse<FinancialYearDto | null>> => {
      try {
        const fy = await financialYearService.getActiveFinancialYear(companyId);
        return { success: true, data: fy };
      } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'financial-year:set-active',
    async (_, companyId: string, financialYearId: string): Promise<ApiResponse<void>> => {
      try {
        await financialYearContextService.setActiveFinancialYear(companyId, financialYearId);
        return { success: true };
      } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'financial-year:list',
    async (_, companyId: string): Promise<ApiResponse<FinancialYearDto[]>> => {
      try {
        const list = await financialYearService.listFinancialYears(companyId);
        return { success: true, data: list };
      } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message };
      }
    },
  );
}
