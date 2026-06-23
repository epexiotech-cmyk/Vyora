import { InventoryStockDto, StockMovementDto } from '@vyora/types';

import { InventoryBalanceRepository, StockMovementRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';
import { financialYearContextService } from './FinancialYearContextService';

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

  public async getGlobalInventory(): Promise<import('@vyora/types').GlobalInventoryRowDto[]> {
    const companyId = companyContextService.getActiveCompany();
    const financialYearId = financialYearContextService.getActiveFinancialYear()?.id;
    if (!companyId || !financialYearId) {
      throw new Error('Active company and financial year must be set');
    }
    const balanceRepo = new InventoryBalanceRepository();
    return await balanceRepo.getAllBalances(companyId, financialYearId);
  }

  public async getNegativeInventory(): Promise<import('@vyora/types').GlobalInventoryRowDto[]> {
    const companyId = companyContextService.getActiveCompany();
    const financialYearId = financialYearContextService.getActiveFinancialYear()?.id;
    if (!companyId || !financialYearId) {
      throw new Error('Active company and financial year must be set');
    }
    const balanceRepo = new InventoryBalanceRepository();
    return await balanceRepo.getNegativeBalances(companyId, financialYearId);
  }
}

export const inventoryService = new InventoryService();
