import { InventoryStockDto, StockMovementDto } from '@vyora/types';

import { StockMovementRepository } from '../repositories';

export class InventoryService {
  private stockMovementRepo = new StockMovementRepository();

  public async getCurrentStock(productId: string): Promise<InventoryStockDto> {
    return await this.stockMovementRepo.getCurrentStock(productId);
  }

  public async getProductLedger(productId: string): Promise<StockMovementDto[]> {
    return await this.stockMovementRepo.getProductLedger(productId);
  }

  public async checkStockAvailability(
    productId: string,
    requiredQuantity: number,
  ): Promise<{ available: boolean; currentStock: number }> {
    const { stock } = await this.getCurrentStock(productId);

    return {
      available: stock >= requiredQuantity,
      currentStock: stock,
    };
  }
}

export const inventoryService = new InventoryService();
