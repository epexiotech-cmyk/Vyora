import { CreateStockMovementInput } from '@vyora/types';

import { StockMovementRepository, DbTransaction } from '../repositories';

import { StockValidationError } from './SalesInvoiceService';

export class InventoryEngine {
  private stockMovementRepo = new StockMovementRepository();

  public getWacForProductSync(
    productId: string,
    tx: DbTransaction,
  ): { wac: number; totalQty: number; totalValue: number } {
    const { stock, totalValue } = this.stockMovementRepo.getCurrentStockSync(productId, tx);

    let wac = 0;
    if (stock > 0) {
      wac = Math.round(totalValue / stock);
    }

    return { wac, totalQty: stock, totalValue };
  }

  public postInboundSync(
    data: Omit<CreateStockMovementInput, 'amountIn' | 'amountOut' | 'rate' | 'quantityOut'> & {
      amountIn: number;
      rate: number;
    },
    tx: DbTransaction,
  ): { movementId: string } {
    if (data.quantityIn <= 0) {
      throw new Error('Inbound quantity must be > 0');
    }
    if (data.rate < 0) {
      throw new Error('Inbound rate must be >= 0');
    }

    const payload: CreateStockMovementInput = {
      ...data,
      quantityOut: 0,
      amountIn: data.amountIn,
      amountOut: 0,
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    return { movementId };
  }

  public postOutboundSync(
    data: Omit<CreateStockMovementInput, 'rate' | 'amountIn' | 'amountOut'>,
    tx: DbTransaction,
  ): { movementId: string; wacApplied: number; amountOut: number } {
    if (data.quantityOut <= 0) {
      throw new Error('Outbound quantity must be > 0');
    }

    const { wac, totalQty, totalValue } = this.getWacForProductSync(data.productId, tx);

    if (totalQty < data.quantityOut) {
      throw new StockValidationError([
        `Insufficient stock for product ${data.productId}. Available: ${totalQty}, Requested: ${data.quantityOut}`,
      ]);
    }

    let allocatedAmountOut = 0;
    if (data.quantityOut === totalQty) {
      // FLUSH RULE: Perfect zeroing of the ledger
      allocatedAmountOut = totalValue;
    } else {
      // Proportional allocation based on WAC
      allocatedAmountOut = Math.round((totalValue / totalQty) * data.quantityOut);
    }

    const payload: CreateStockMovementInput = {
      ...data,
      quantityIn: 0,
      amountIn: 0,
      amountOut: allocatedAmountOut,
      rate: wac, // Informational WAC rate
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    return { movementId, wacApplied: wac, amountOut: allocatedAmountOut };
  }

  public processSalesReturnSync(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx: DbTransaction,
    referenceLineId?: string,
  ): { movementId: string } {
    if (quantityToReturn <= 0) {
      throw new Error('Return quantity must be > 0');
    }

    const originalMovement = this.stockMovementRepo.getMovementByReferenceSync(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
      referenceLineId,
    );

    if (!originalMovement) {
      throw new Error('Original outbound movement not found for return');
    }

    // Retrieve already returned totals against this specific original movement
    const returnedTotals = this.stockMovementRepo.getReturnedTotalsForMovementSync(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
      originalMovement.referenceLineId,
    );

    const alreadyReturnedQty = returnedTotals.returnedQty;
    const alreadyReturnedAmount = returnedTotals.returnedAmount;

    if (alreadyReturnedQty + quantityToReturn > originalMovement.quantityOut) {
      throw new Error('Return quantity exceeds original outbound quantity');
    }

    let restoredAmountIn = 0;
    if (alreadyReturnedQty + quantityToReturn === originalMovement.quantityOut) {
      // RETURN FLUSH RULE: Last partial return absorbs the exact residual value
      restoredAmountIn = originalMovement.amountOut - alreadyReturnedAmount;
    } else {
      // Proportional restoration
      restoredAmountIn = Math.round(
        (originalMovement.amountOut / originalMovement.quantityOut) * quantityToReturn,
      );
    }

    const payload: CreateStockMovementInput = {
      companyId: originalMovement.companyId,
      financialYearId: originalMovement.financialYearId,
      productId: productId,
      movementType: 'SALE_RETURN',
      referenceType: originalReferenceType,
      referenceId: originalReferenceId,
      referenceLineId: originalMovement.referenceLineId, // Preserve Line ID if it existed
      quantityIn: quantityToReturn,
      quantityOut: 0,
      amountIn: restoredAmountIn,
      amountOut: 0,
      rate: originalMovement.rate, // Historical WAC rate
      movementDate: new Date(),
      remarks: 'Sales Return',
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    return { movementId };
  }

  public processPurchaseReturnSync(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx: DbTransaction,
    referenceLineId?: string,
  ): { movementId: string } {
    if (quantityToReturn <= 0) {
      throw new Error('Return quantity must be > 0');
    }

    const originalMovement = this.stockMovementRepo.getMovementByReferenceSync(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
      referenceLineId,
    );

    if (!originalMovement) {
      throw new Error('Original inbound movement not found for return');
    }

    // Retrieve already returned totals against this specific original movement
    const returnedTotals = this.stockMovementRepo.getPurchaseReturnedTotalsForMovementSync(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
      originalMovement.referenceLineId,
    );

    const alreadyReturnedQty = returnedTotals.returnedQty;
    const alreadyReturnedAmount = returnedTotals.returnedAmount;

    if (alreadyReturnedQty + quantityToReturn > originalMovement.quantityIn) {
      throw new Error('Return quantity exceeds original inbound quantity');
    }

    let allocatedAmountOut = 0;
    if (alreadyReturnedQty + quantityToReturn === originalMovement.quantityIn) {
      // PURCHASE RETURN FLUSH RULE: Last partial return drains the exact residual value
      allocatedAmountOut = originalMovement.amountIn - alreadyReturnedAmount;
    } else {
      // Proportional reduction
      allocatedAmountOut = Math.round(
        (originalMovement.amountIn / originalMovement.quantityIn) * quantityToReturn,
      );
    }

    const payload: CreateStockMovementInput = {
      companyId: originalMovement.companyId,
      financialYearId: originalMovement.financialYearId,
      productId: productId,
      movementType: 'PURCHASE_RETURN',
      referenceType: originalReferenceType,
      referenceId: originalReferenceId,
      referenceLineId: originalMovement.referenceLineId,
      quantityIn: 0,
      quantityOut: quantityToReturn,
      amountIn: 0,
      amountOut: allocatedAmountOut,
      rate: originalMovement.rate, // Historical rate
      movementDate: new Date(),
      remarks: 'Purchase Return',
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    return { movementId };
  }
}

export const inventoryEngine = new InventoryEngine();
