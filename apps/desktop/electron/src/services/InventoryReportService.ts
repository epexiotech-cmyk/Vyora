import {
  StockSummaryDto,
  StockSummaryRowDto,
  StockLedgerDto,
  StockLedgerRowDto,
  StockMovementRegisterDto,
  StockMovementRegisterRowDto,
} from '@vyora/types';

import { inventoryQueryService } from './InventoryQueryService';

export class InventoryReportService {
  /**
   * Retrieves active inventory balances through InventoryQueryService
   * and assembles them into the canonical StockSummaryDto.
   * Native mathematical values (WAC, Value) are preserved without recalculation.
   */
  public async getStockSummaryReport(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<StockSummaryDto> {
    const activeBalances = await inventoryQueryService.getActiveInventoryBalances(
      companyId,
      financialYearId,
    );

    const rows: StockSummaryRowDto[] = [];
    let totalInventoryValuePaise = 0;

    for (const balance of activeBalances) {
      const row: StockSummaryRowDto = {
        productId: balance.productId,
        productName: balance.productName,
        sku: balance.productSku || '',
        unitId: balance.unitId,
        unitName: balance.unitName,
        unitShortName: balance.unitShortName,
        closingQuantity: balance.currentQty,
        wacPaise: balance.currentWacPaise,
        totalValuePaise: balance.currentValuePaise,
      };

      rows.push(row);
      totalInventoryValuePaise += balance.currentValuePaise;
    }

    return {
      companyId,
      financialYearId,
      asOfDate,
      rows,
      totalValuePaise: totalInventoryValuePaise,
    };
  }

  /**
   * Retrieves deterministic bulk movements for a specific product,
   * calculates chronological running balances, and assembles the StockLedgerDto.
   */
  public async getStockLedgerReport(
    companyId: string,
    financialYearId: string,
    productId: string,
    productName: string,
    unitShortName: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<StockLedgerDto> {
    const movements = await inventoryQueryService.getBulkStockMovements(
      companyId,
      financialYearId,
      toDate,
      productId,
    );

    const rows: StockLedgerRowDto[] = [];
    let runningBalance = 0;
    let openingQuantity = 0;

    for (const movement of movements) {
      // Aggregate into opening balance if before fromDate
      if (fromDate && movement.movementDate < fromDate) {
        openingQuantity += movement.quantityIn - movement.quantityOut;
        runningBalance = openingQuantity;
        continue;
      }

      runningBalance += movement.quantityIn - movement.quantityOut;

      rows.push({
        movementId: movement.id,
        movementDate: movement.movementDate,
        voucherType: movement.referenceType,
        voucherNo: movement.referenceId, // Will be mapped to formatted voucher string via UI or separate mapping
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        movementType: movement.movementType,
        qtyIn: movement.quantityIn,
        qtyOut: movement.quantityOut,
        balanceQty: runningBalance,
        ratePaise: movement.rate,
        remarks: movement.remarks || undefined,
      });
    }

    return {
      productId,
      productName,
      unitShortName,
      fromDate,
      toDate,
      openingQuantity,
      rows,
      closingQuantity: runningBalance,
    };
  }

  /**
   * Retrieves global deterministic bulk movements, uses memory grouping (Map)
   * to attach product metadata in O(1), and assembles the StockMovementRegisterDto.
   */
  public async getStockMovementRegisterReport(
    companyId: string,
    financialYearId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<StockMovementRegisterDto> {
    // 1. Fetch bulk movements and active balances
    const [movements, activeBalances] = await Promise.all([
      inventoryQueryService.getBulkStockMovements(companyId, financialYearId, toDate),
      inventoryQueryService.getActiveInventoryBalances(companyId, financialYearId),
    ]);

    // 2. Group product metadata in a Map for O(1) lookups
    const productMap = new Map<string, { productName: string; unitShortName: string }>();

    for (const balance of activeBalances) {
      productMap.set(balance.productId, {
        productName: balance.productName,
        unitShortName: balance.unitShortName,
      });
    }

    // 3. Assemble chronological register
    const rows: StockMovementRegisterRowDto[] = [];

    for (const movement of movements) {
      if (fromDate && movement.movementDate < fromDate) {
        continue;
      }

      const productInfo = productMap.get(movement.productId) || {
        productName: 'Unknown Product',
        unitShortName: 'N/A',
      };

      rows.push({
        movementId: movement.id,
        movementDate: movement.movementDate,
        voucherType: movement.referenceType,
        voucherNo: movement.referenceId, // Same fallback as Ledger
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        movementType: movement.movementType,
        qtyIn: movement.quantityIn,
        qtyOut: movement.quantityOut,
        ratePaise: movement.rate,
        remarks: movement.remarks || undefined,
        productId: movement.productId,
        productName: productInfo.productName,
        unitShortName: productInfo.unitShortName,
      });
    }

    return {
      companyId,
      financialYearId,
      fromDate,
      toDate,
      rows,
    };
  }
}

export const inventoryReportService = new InventoryReportService();
