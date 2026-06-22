import { ApiResponse, InventoryStockDto, StockMovementDto, StockSummaryDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { DbTransaction } from '../../repositories/BaseRepository';
import { companyContextService } from '../../services/CompanyContextService';
import { dbService } from '../../services/database/DatabaseService';
import { inventoryEngine } from '../../services/InventoryEngine';
import { inventoryService } from '../../services/InventoryService';
import { createIpcHandler } from '../wrapper';

export function registerInventoryHandlers() {
  createIpcHandler<StockSummaryDto>(
    'inventory:getStockSummary',
    async (_event, productId: string) => {
      const db = dbService.getDb();
      return db.transaction(async (tx: DbTransaction) => {
        const result = await inventoryEngine.getWacForProduct(productId, tx);
        return { success: true, data: result };
      });
    },
  );
  ipcMain.handle(
    'inventory:stock:get',
    async (_event, productId: string): Promise<ApiResponse<InventoryStockDto>> => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) throw new Error('No active company selected');
        const result = await inventoryService.getCurrentStock(productId);
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
        const result = await inventoryService.getProductLedger(productId);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
