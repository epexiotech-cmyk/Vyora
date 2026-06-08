import { ApiResponse, CreateTaxInput, TaxDto, UpdateTaxInput } from '@vyora/types';
import { ipcMain } from 'electron';

import { taxService } from '../../services/TaxService';

export function registerTaxHandlers() {
  ipcMain.handle('db:taxes:getAll', async (): Promise<ApiResponse<TaxDto[]>> => {
    try {
      const results = await taxService.getAllTaxes();
      return { success: true, data: results };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:taxes:create',
    async (_event, data: Omit<CreateTaxInput, 'companyId'>): Promise<ApiResponse<TaxDto>> => {
      try {
        const result = await taxService.createTax(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:taxes:update',
    async (_event, data: UpdateTaxInput): Promise<ApiResponse<TaxDto>> => {
      try {
        const result = await taxService.updateTax(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
