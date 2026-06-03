import { ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { inventoryService } from '../../services/InventoryService';

export function registerInventoryHandlers() {
  ipcMain.handle(
    'inventory:stock:get',
    async (_event, productId: string): Promise<ApiResponse<{ stock: number }>> => {
      try {
        const result = await inventoryService.getCurrentStock(productId);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'inventory:ledger:get',
    async (_event, productId: string): Promise<ApiResponse<unknown>> => {
      try {
        const result = await inventoryService.getProductLedger(productId);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
