import { CreateCompanyInput, ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { companyBootstrapService } from '../../services/CompanyBootstrapService';
import { companyContextService } from '../../services/CompanyContextService';
import { financialYearContextService } from '../../services/FinancialYearContextService';

export function registerBootstrapHandlers() {
  ipcMain.handle('bootstrap:status', async (): Promise<ApiResponse<boolean>> => {
    try {
      const isCompleted = await companyBootstrapService.isSetupCompleted();
      return { success: true, data: isCompleted };
    } catch (error) {
      console.error('Error fetching bootstrap status:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'bootstrap:create-company',
    async (_, payload: CreateCompanyInput): Promise<ApiResponse<string>> => {
      try {
        const companyId = await companyBootstrapService.createCompany(payload);
        await companyContextService.loadActiveCompany();
        await financialYearContextService.loadActiveFinancialYear(companyId);
        return { success: true, data: companyId };
      } catch (error) {
        console.error('Error creating company during bootstrap:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
