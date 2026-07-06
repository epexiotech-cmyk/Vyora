import {
  StockSummaryDto,
  StockSummaryRowDto,
  StockLedgerDto,
  StockLedgerRowDto,
  StockMovementRegisterDto,
  StockMovementRegisterRowDto,
  StockAgeingDto,
  StockAgeingRowDto,
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

  /**
   * Retrieves stock movements in bulk and groups them by product.
   * Simulates FIFO receipt layers to determine the age of remaining stock.
   * Maps results into bucketing structures for the Stock Ageing Report.
   */
  public async getStockAgeingReport(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<StockAgeingDto> {
    const [movements, activeBalances] = await Promise.all([
      inventoryQueryService.getBulkStockMovements(companyId, financialYearId, asOfDate),
      inventoryQueryService.getActiveInventoryBalances(companyId, financialYearId),
    ]);

    const productBalanceMap = new Map<string, (typeof activeBalances)[0]>();
    for (const balance of activeBalances) {
      productBalanceMap.set(balance.productId, balance);
    }

    const productMovementsMap = new Map<string, typeof movements>();
    for (const movement of movements) {
      if (!productMovementsMap.has(movement.productId)) {
        productMovementsMap.set(movement.productId, []);
      }
      productMovementsMap.get(movement.productId)!.push(movement);
    }

    const rows: StockAgeingRowDto[] = [];
    let grandTotalQty = 0;
    let grandTotalValuePaise = 0;

    const referenceDate = asOfDate || new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    for (const [productId, productMovements] of productMovementsMap.entries()) {
      productMovements.sort((a, b) => a.movementDate.getTime() - b.movementDate.getTime());

      const fifoLayers: { date: Date; qty: number }[] = [];
      let currentQty = 0;

      for (const movement of productMovements) {
        if (movement.quantityIn > 0) {
          fifoLayers.push({ date: movement.movementDate, qty: movement.quantityIn });
          currentQty += movement.quantityIn;
        } else if (movement.quantityOut > 0) {
          let outQty = movement.quantityOut;
          currentQty -= outQty;

          while (outQty > 0 && fifoLayers.length > 0) {
            const oldestLayer = fifoLayers[0];
            if (oldestLayer.qty <= outQty) {
              outQty -= oldestLayer.qty;
              fifoLayers.shift();
            } else {
              oldestLayer.qty -= outQty;
              outQty = 0;
            }
          }
        }
      }

      if (currentQty <= 0) continue;

      const balanceInfo = productBalanceMap.get(productId);
      const productName = balanceInfo?.productName || 'Unknown Product';
      const sku = balanceInfo?.productSku || '';
      const unitShortName = balanceInfo?.unitShortName || 'N/A';

      const wacPaise = balanceInfo?.currentWacPaise || 0;
      const totalValuePaise = currentQty * wacPaise;

      let age0To30Qty = 0;
      let age31To60Qty = 0;
      let age61To90Qty = 0;
      let age91To180Qty = 0;
      let age181To365Qty = 0;
      let ageAbove365Qty = 0;

      for (const layer of fifoLayers) {
        if (layer.qty <= 0) continue;
        const daysOld = Math.floor((referenceDate.getTime() - layer.date.getTime()) / msPerDay);

        if (daysOld <= 30) age0To30Qty += layer.qty;
        else if (daysOld <= 60) age31To60Qty += layer.qty;
        else if (daysOld <= 90) age61To90Qty += layer.qty;
        else if (daysOld <= 180) age91To180Qty += layer.qty;
        else if (daysOld <= 365) age181To365Qty += layer.qty;
        else ageAbove365Qty += layer.qty;
      }

      rows.push({
        productId,
        sku,
        productName,
        unitShortName,
        totalQuantity: currentQty,
        age0To30Qty,
        age31To60Qty,
        age61To90Qty,
        age91To180Qty,
        age181To365Qty,
        ageAbove365Qty,
        wacPaise,
        totalValuePaise,
      });

      grandTotalQty += currentQty;
      grandTotalValuePaise += totalValuePaise;
    }

    return {
      companyId,
      financialYearId,
      asOfDate,
      rows,
      totalQuantity: grandTotalQty,
      totalValuePaise: grandTotalValuePaise,
    };
  }
}

export const inventoryReportService = new InventoryReportService();
