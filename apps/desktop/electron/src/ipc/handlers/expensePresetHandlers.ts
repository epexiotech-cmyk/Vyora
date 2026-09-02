import {
  ExpensePresetListDto,
  SearchExpensePresetsOptions,
  CreateExpensePresetInput,
  UpdateExpensePresetInput,
  ExpensePresetDto,
  ApiResponse,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';
import { expensePresetService } from '../../services/ExpensePresetService';

export function registerExpensePresetHandlers() {
  ipcMain.handle(
    'expense-presets:search',
    async (_, options: SearchExpensePresetsOptions): Promise<ApiResponse<ExpensePresetListDto>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) return { success: false, error: 'No active company found' };

        const data = await expensePresetService.search(options);
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  );

  ipcMain.handle(
    'expense-presets:getById',
    async (_, id: string): Promise<ApiResponse<ExpensePresetDto | null>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) return { success: false, error: 'No active company found' };

        const data = await expensePresetService.getById(id);
        return { success: true, data: data || null };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  );

  ipcMain.handle(
    'expense-presets:create',
    async (_, input: CreateExpensePresetInput): Promise<ApiResponse<string>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) return { success: false, error: 'No active company found' };

        const { id: presetId } = await expensePresetService.create(input);
        return { success: true, data: presetId };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  );

  ipcMain.handle(
    'expense-presets:update',
    async (_, input: UpdateExpensePresetInput): Promise<ApiResponse<void>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) return { success: false, error: 'No active company found' };

        await expensePresetService.update(input);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  );

  ipcMain.handle('expense-presets:delete', async (_, id: string): Promise<ApiResponse<void>> => {
    try {
      const companyId = companyContextService.getActiveCompany();
      if (!companyId) return { success: false, error: 'No active company found' };

      await expensePresetService.deactivate(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
