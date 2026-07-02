import { InventoryBalanceRepository } from '../repositories/InventoryBalanceRepository';
import { StockMovementRepository } from '../repositories/StockMovementRepository';

const inventoryBalanceRepo = new InventoryBalanceRepository();
const stockMovementRepo = new StockMovementRepository();

export class InventoryQueryService {
  /**
   * Retrieves active inventory balances, joined with product and unit data.
   * Useful for Stock Summary and generating current valuations.
   */
  public async getActiveInventoryBalances(companyId: string, financialYearId: string) {
    return await inventoryBalanceRepo.getActiveInventoryBalances(companyId, financialYearId);
  }

  /**
   * Retrieves stock movements in bulk.
   * Supports historical filtering and specific product filtering.
   * Useful for Stock Ledger, Movement Registers, and historical replay.
   */
  public async getBulkStockMovements(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
    productId?: string,
  ) {
    return await stockMovementRepo.getBulkStockMovements(
      companyId,
      financialYearId,
      asOfDate,
      productId,
    );
  }
}

export const inventoryQueryService = new InventoryQueryService();
