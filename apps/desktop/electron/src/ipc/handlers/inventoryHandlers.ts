import { ApiResponse, InventoryStockDto, StockMovementDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';
import { inventoryService } from '../../services/InventoryService';

export function registerInventoryHandlers() {
  ipcMain.handle(
    'inventory:stock:get',
    async (_event, productId: string): Promise<ApiResponse<InventoryStockDto>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) throw new Error('No active company selected');
        const result = await inventoryService.getCurrentStock(companyId, productId);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'inventory:ledger:get',
    async (_event, productId: string): Promise<ApiResponse<StockMovementDto[]>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) throw new Error('No active company selected');
        const result = await inventoryService.getProductLedger(companyId, productId);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
