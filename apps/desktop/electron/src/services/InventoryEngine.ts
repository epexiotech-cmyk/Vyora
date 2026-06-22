import { CreateStockMovementInput } from '@vyora/types';

import { StockMovementRepository, DbTransaction } from '../repositories';

import { StockValidationError } from './SalesInvoiceService';

export class InventoryEngine {
  private stockMovementRepo = new StockMovementRepository();

  public async getWacForProduct(
    productId: string,
    tx?: DbTransaction,
  ): Promise<{ wac: number; totalQty: number; totalValue: number }> {
    const { stock } = await this.stockMovementRepo.getCurrentStock(productId, tx);

    // Total value tracking requires ledger traversal which is stubbed out
    // since 'amountIn' / 'amountOut' are not in schema.
    const totalValue = 0;
    let wac = 0;
    if (stock > 0) {
      wac = Math.round(totalValue / stock);
    }

    return { wac, totalQty: stock, totalValue };
  }

  public async postInbound(
    data: CreateStockMovementInput,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    if (data.quantityIn <= 0) {
      throw new Error('Inbound quantity must be > 0');
    }
    if (data.rate < 0) {
      throw new Error('Inbound rate must be >= 0');
    }

    const payload: CreateStockMovementInput = {
      ...data,
      quantityOut: 0,
    };

    const { movementId } = await this.stockMovementRepo.createMovement(payload, tx);
    return { movementId };
  }

  public async postOutbound(
    data: CreateStockMovementInput,
    tx?: DbTransaction,
  ): Promise<{ movementId: string; wacApplied: number }> {
    if (data.quantityOut <= 0) {
      throw new Error('Outbound quantity must be > 0');
    }

    const { wac, totalQty } = await this.getWacForProduct(data.productId, tx);

    if (totalQty < data.quantityOut) {
      throw new StockValidationError([
        `Insufficient stock for product ${data.productId}. Available: ${totalQty}, Requested: ${data.quantityOut}`,
      ]);
    }

    const payload: CreateStockMovementInput = {
      ...data,
      quantityIn: 0,
      rate: wac, // Informational WAC rate
    };

    const { movementId } = await this.stockMovementRepo.createMovement(payload, tx);
    return { movementId, wacApplied: wac };
  }

  public async processSalesReturn(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    if (quantityToReturn <= 0) {
      throw new Error('Return quantity must be > 0');
    }

    const originalMovement = await this.stockMovementRepo.getMovementByReference(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
    );

    if (!originalMovement) {
      throw new Error('Original outbound movement not found for return');
    }

    const returnedTotals = await this.stockMovementRepo.getReturnedTotalsForMovement(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
    );

    const alreadyReturnedQty = returnedTotals.returnedQty;

    if (alreadyReturnedQty + quantityToReturn > originalMovement.quantityOut) {
      throw new Error('Return quantity exceeds original outbound quantity');
    }

    const payload: CreateStockMovementInput = {
      companyId: originalMovement.companyId,
      financialYearId: originalMovement.financialYearId,
      productId: productId,
      movementType: 'SALE_RETURN',
      referenceType: originalReferenceType,
      referenceId: originalReferenceId,
      quantityIn: quantityToReturn,
      quantityOut: 0,
      rate: originalMovement.rate, // Historical WAC rate
      movementDate: new Date(),
      remarks: 'Sales Return',
    };

    const { movementId } = await this.stockMovementRepo.createMovement(payload, tx);
    return { movementId };
  }

  public async processPurchaseReturn(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    if (quantityToReturn <= 0) {
      throw new Error('Return quantity must be > 0');
    }

    const originalMovement = await this.stockMovementRepo.getMovementByReference(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
    );

    if (!originalMovement) {
      throw new Error('Original inbound movement not found for return');
    }

    const returnedTotals = await this.stockMovementRepo.getPurchaseReturnedTotalsForMovement(
      originalReferenceType,
      originalReferenceId,
      productId,
      tx,
    );

    const alreadyReturnedQty = returnedTotals.returnedQty;

    if (alreadyReturnedQty + quantityToReturn > originalMovement.quantityIn) {
      throw new Error('Return quantity exceeds original inbound quantity');
    }

    const payload: CreateStockMovementInput = {
      companyId: originalMovement.companyId,
      financialYearId: originalMovement.financialYearId,
      productId: productId,
      movementType: 'PURCHASE_RETURN',
      referenceType: originalReferenceType,
      referenceId: originalReferenceId,
      quantityIn: 0,
      quantityOut: quantityToReturn,
      rate: originalMovement.rate, // Historical rate
      movementDate: new Date(),
      remarks: 'Purchase Return',
    };

    const { movementId } = await this.stockMovementRepo.createMovement(payload, tx);
    return { movementId };
  }
}

export const inventoryEngine = new InventoryEngine();
