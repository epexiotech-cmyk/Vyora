import { CreateCompanyInput, CreateCompanyInputSchema, ApiResponse, ZodError } from '@vyora/types';
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
        const parsed = CreateCompanyInputSchema.parse(payload);
        const companyId = await companyBootstrapService.createCompany(parsed);
        await companyContextService.loadActiveCompany();
        await financialYearContextService.loadActiveFinancialYear(companyId);
        return { success: true, data: companyId };
      } catch (error) {
        if (error instanceof ZodError) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { success: false, error: 'Validation failed', validations: (error as any).errors };
        }
        console.error('Error creating company during bootstrap:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
