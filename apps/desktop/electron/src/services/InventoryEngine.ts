import { CreateStockMovementInput } from '@vyora/types';

import {
  StockMovementRepository,
  InventoryBalanceRepository,
  DbTransaction,
  TransactionExecutor,
} from '../repositories';

import { StockValidationError } from './SalesInvoiceService';

export class InventoryEngine {
  private stockMovementRepo = new StockMovementRepository();
  private balanceRepo = new InventoryBalanceRepository();

  public async getWacForProduct(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<{ wac: number; totalQty: number; totalValue: number }> {
    const balance = await this.balanceRepo.getBalance(companyId, financialYearId, productId, tx);

    if (!balance) {
      return { wac: 0, totalQty: 0, totalValue: 0 };
    }

    return {
      wac: balance.currentWacPaise,
      totalQty: balance.currentQty,
      totalValue: balance.currentValuePaise,
    };
  }

  private async applyMovementToBalance(
    companyId: string,
    financialYearId: string,
    productId: string,
    quantityIn: number,
    quantityOut: number,
    rate: number,
    tx: DbTransaction,
  ): Promise<void> {
    const balance = await this.balanceRepo.getBalance(companyId, financialYearId, productId, tx);

    let currentQty = balance ? balance.currentQty : 0;
    let currentWacPaise = balance ? balance.currentWacPaise : 0;
    let currentValuePaise = balance ? balance.currentValuePaise : 0;

    if (quantityIn > 0) {
      if (currentQty < 0) {
        currentWacPaise = rate;
      } else {
        const totalInValue = quantityIn * rate;
        const newValue = currentValuePaise + totalInValue;
        const newQty = currentQty + quantityIn;
        currentWacPaise = newQty > 0 ? Math.round(newValue / newQty) : 0;
      }
      currentQty += quantityIn;
      currentValuePaise = currentQty * currentWacPaise;
    } else if (quantityOut > 0) {
      const totalOutValue = quantityOut * rate;
      currentValuePaise -= totalOutValue;
      currentQty -= quantityOut;
      currentWacPaise =
        currentQty > 0 ? Math.round(currentValuePaise / currentQty) : currentWacPaise;
      currentValuePaise = currentQty * currentWacPaise;
    }

    await this.balanceRepo.upsertBalance(
      companyId,
      financialYearId,
      productId,
      currentQty,
      currentWacPaise,
      currentValuePaise,
      tx,
    );
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

    const executeLogic = async (innerTx: DbTransaction) => {
      const { movementId } = await this.stockMovementRepo.createMovement(payload, innerTx);
      await this.applyMovementToBalance(
        data.companyId,
        data.financialYearId,
        data.productId,
        data.quantityIn,
        0,
        data.rate,
        innerTx,
      );
      return { movementId };
    };

    if (tx) return await executeLogic(tx);
    return await this.balanceRepo.transaction(executeLogic);
  }

  public async postOutbound(
    data: CreateStockMovementInput,
    tx?: DbTransaction,
  ): Promise<{ movementId: string; wacApplied: number }> {
    if (data.quantityOut <= 0) {
      throw new Error('Outbound quantity must be > 0');
    }

    const executeLogic = async (innerTx: DbTransaction) => {
      const { wac, totalQty } = await this.getWacForProduct(
        data.companyId,
        data.financialYearId,
        data.productId,
        innerTx,
      );

      if (totalQty < data.quantityOut) {
        throw new StockValidationError([
          `Insufficient stock for product ${data.productId}. Available: ${totalQty}, Requested: ${data.quantityOut}`,
        ]);
      }

      const payload: CreateStockMovementInput = {
        ...data,
        quantityIn: 0,
        rate: wac,
      };

      const { movementId } = await this.stockMovementRepo.createMovement(payload, innerTx);
      await this.applyMovementToBalance(
        data.companyId,
        data.financialYearId,
        data.productId,
        0,
        data.quantityOut,
        wac,
        innerTx,
      );

      return { movementId, wacApplied: wac };
    };

    if (tx) return await executeLogic(tx);
    return await this.balanceRepo.transaction(executeLogic);
  }

  public async processSalesReturn(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    if (quantityToReturn <= 0) throw new Error('Return quantity must be > 0');

    const executeLogic = async (innerTx: DbTransaction) => {
      const originalMovement = await this.stockMovementRepo.getMovementByReference(
        originalReferenceType,
        originalReferenceId,
        productId,
        innerTx,
      );
      if (!originalMovement) throw new Error('Original outbound movement not found for return');

      const returnedTotals = await this.stockMovementRepo.getReturnedTotalsForMovement(
        originalReferenceType,
        originalReferenceId,
        productId,
        innerTx,
      );
      if (returnedTotals.returnedQty + quantityToReturn > originalMovement.quantityOut) {
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
        rate: originalMovement.rate,
        movementDate: new Date(),
        remarks: 'Sales Return',
      };

      const { movementId } = await this.stockMovementRepo.createMovement(payload, innerTx);
      await this.applyMovementToBalance(
        payload.companyId,
        payload.financialYearId,
        payload.productId,
        payload.quantityIn,
        0,
        payload.rate,
        innerTx,
      );
      return { movementId };
    };

    if (tx) return await executeLogic(tx);
    return await this.balanceRepo.transaction(executeLogic);
  }

  public async processPurchaseReturn(
    originalReferenceType: string,
    originalReferenceId: string,
    productId: string,
    quantityToReturn: number,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    if (quantityToReturn <= 0) throw new Error('Return quantity must be > 0');

    const executeLogic = async (innerTx: DbTransaction) => {
      const originalMovement = await this.stockMovementRepo.getMovementByReference(
        originalReferenceType,
        originalReferenceId,
        productId,
        innerTx,
      );
      if (!originalMovement) throw new Error('Original inbound movement not found for return');

      const returnedTotals = await this.stockMovementRepo.getPurchaseReturnedTotalsForMovement(
        originalReferenceType,
        originalReferenceId,
        productId,
        innerTx,
      );
      if (returnedTotals.returnedQty + quantityToReturn > originalMovement.quantityIn) {
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
        rate: originalMovement.rate,
        movementDate: new Date(),
        remarks: 'Purchase Return',
      };

      const { movementId } = await this.stockMovementRepo.createMovement(payload, innerTx);
      await this.applyMovementToBalance(
        payload.companyId,
        payload.financialYearId,
        payload.productId,
        0,
        payload.quantityOut,
        payload.rate,
        innerTx,
      );
      return { movementId };
    };

    if (tx) return await executeLogic(tx);
    return await this.balanceRepo.transaction(executeLogic);
  }

  public async reverseSalesInvoice(invoiceId: string, tx?: DbTransaction): Promise<void> {
    const executeLogic = async (innerTx: DbTransaction) => {
      const originalMovements = await this.stockMovementRepo.getMovementsByReference(
        'SALES_INVOICE',
        invoiceId,
        innerTx,
      );
      if (originalMovements.length === 0)
        throw new Error(`No inventory movements found for Sales Invoice ${invoiceId}`);

      for (const movement of originalMovements) {
        if (movement.quantityOut <= 0) continue;

        const payload: CreateStockMovementInput = {
          companyId: movement.companyId,
          financialYearId: movement.financialYearId,
          productId: movement.productId,
          movementType: 'SALE_REVERSAL',
          referenceType: 'SALES_INVOICE_CANCELLATION',
          referenceId: invoiceId,
          quantityIn: movement.quantityOut,
          quantityOut: 0,
          rate: movement.rate,
          movementDate: new Date(),
          remarks: `Cancellation Reversal for Sales Invoice ${invoiceId}`,
        };

        await this.stockMovementRepo.createMovement(payload, innerTx);
        await this.applyMovementToBalance(
          payload.companyId,
          payload.financialYearId,
          payload.productId,
          payload.quantityIn,
          0,
          payload.rate,
          innerTx,
        );
      }
    };

    if (tx) await executeLogic(tx);
    else await this.balanceRepo.transaction(executeLogic);
  }

  public async reversePurchaseInvoice(purchaseId: string, tx?: DbTransaction): Promise<void> {
    const executeLogic = async (innerTx: DbTransaction) => {
      const originalMovements = await this.stockMovementRepo.getMovementsByReference(
        'PURCHASE_BILL',
        purchaseId,
        innerTx,
      );
      if (originalMovements.length === 0)
        throw new Error(`No inventory movements found for Purchase Bill ${purchaseId}`);

      for (const movement of originalMovements) {
        if (movement.quantityIn <= 0) continue;

        const payload: CreateStockMovementInput = {
          companyId: movement.companyId,
          financialYearId: movement.financialYearId,
          productId: movement.productId,
          movementType: 'PURCHASE_REVERSAL',
          referenceType: 'PURCHASE_BILL_CANCELLATION',
          referenceId: purchaseId,
          quantityIn: 0,
          quantityOut: movement.quantityIn,
          rate: movement.rate,
          movementDate: new Date(),
          remarks: `Cancellation Reversal for Purchase Bill ${purchaseId}`,
        };

        await this.stockMovementRepo.createMovement(payload, innerTx);
        await this.applyMovementToBalance(
          payload.companyId,
          payload.financialYearId,
          payload.productId,
          0,
          payload.quantityOut,
          payload.rate,
          innerTx,
        );
      }
    };

    if (tx) await executeLogic(tx);
    else await this.balanceRepo.transaction(executeLogic);
  }

  public async rebuildInventoryBalance(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<void> {
    const executeLogic = async (innerTx: DbTransaction) => {
      const movements = await this.stockMovementRepo.getProductLedger(productId);
      const relevantMovements = movements.filter(
        (m) => m.companyId === companyId && m.financialYearId === financialYearId,
      );

      let currentQty = 0;
      let currentWacPaise = 0;
      let currentValuePaise = 0;

      for (const m of relevantMovements) {
        if (m.quantityIn > 0) {
          if (currentQty < 0) {
            currentWacPaise = m.rate;
          } else {
            const totalInValue = m.quantityIn * m.rate;
            const newValue = currentValuePaise + totalInValue;
            const newQty = currentQty + m.quantityIn;
            currentWacPaise = newQty > 0 ? Math.round(newValue / newQty) : 0;
          }
          currentQty += m.quantityIn;
          currentValuePaise = currentQty * currentWacPaise;
        } else if (m.quantityOut > 0) {
          const totalOutValue = m.quantityOut * m.rate;
          currentValuePaise -= totalOutValue;
          currentQty -= m.quantityOut;
          currentWacPaise =
            currentQty > 0 ? Math.round(currentValuePaise / currentQty) : currentWacPaise;
          currentValuePaise = currentQty * currentWacPaise;
        }
      }

      await this.balanceRepo.upsertBalance(
        companyId,
        financialYearId,
        productId,
        currentQty,
        currentWacPaise,
        currentValuePaise,
        innerTx,
      );
    };

    if (tx) await executeLogic(tx);
    else await this.balanceRepo.transaction(executeLogic);
  }

  public async rebuildAllInventoryBalances(tx?: DbTransaction): Promise<void> {
    const executeLogic = async (innerTx: DbTransaction) => {
      const keys = await this.stockMovementRepo.getAllDistinctBalancesKeys(innerTx);
      for (const key of keys) {
        await this.rebuildInventoryBalance(
          key.companyId,
          key.financialYearId,
          key.productId,
          innerTx,
        );
      }
    };

    if (tx) await executeLogic(tx);
    else await this.balanceRepo.transaction(executeLogic);
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  private applyMovementToBalanceSync(
    companyId: string,
    financialYearId: string,
    productId: string,
    quantityIn: number,
    quantityOut: number,
    rate: number,
    tx: TransactionExecutor,
  ): void {
    const balance = this.balanceRepo.getBalanceSync(companyId, financialYearId, productId, tx);

    let currentQty = balance ? balance.currentQty : 0;
    let currentWacPaise = balance ? balance.currentWacPaise : 0;
    let currentValuePaise = balance ? balance.currentValuePaise : 0;

    if (quantityIn > 0) {
      if (currentQty < 0) {
        currentWacPaise = rate;
      } else {
        const totalInValue = quantityIn * rate;
        const newValue = currentValuePaise + totalInValue;
        const newQty = currentQty + quantityIn;
        currentWacPaise = newQty > 0 ? Math.round(newValue / newQty) : 0;
      }
      currentQty += quantityIn;
      currentValuePaise = currentQty * currentWacPaise;
    } else if (quantityOut > 0) {
      const totalOutValue = quantityOut * rate;
      currentValuePaise -= totalOutValue;
      currentQty -= quantityOut;
      currentWacPaise =
        currentQty > 0 ? Math.round(currentValuePaise / currentQty) : currentWacPaise;
      currentValuePaise = currentQty * currentWacPaise;
    }

    this.balanceRepo.upsertBalanceSync(
      companyId,
      financialYearId,
      productId,
      currentQty,
      currentWacPaise,
      currentValuePaise,
      tx,
    );
  }

  public postInboundSync(
    data: CreateStockMovementInput,
    tx: TransactionExecutor,
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
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    this.applyMovementToBalanceSync(
      data.companyId,
      data.financialYearId,
      data.productId,
      data.quantityIn,
      0,
      data.rate,
      tx,
    );
    return { movementId };
  }

  public reversePurchaseInvoiceSync(purchaseId: string, tx: TransactionExecutor): void {
    const originalMovements = this.stockMovementRepo.getMovementsByReferenceSync(
      'PURCHASE_BILL',
      purchaseId,
      tx,
    );
    if (originalMovements.length === 0)
      throw new Error(`No inventory movements found for Purchase Bill ${purchaseId}`);

    for (const movement of originalMovements) {
      if (movement.quantityIn <= 0) continue;

      const payload: CreateStockMovementInput = {
        companyId: movement.companyId,
        financialYearId: movement.financialYearId,
        productId: movement.productId,
        movementType: 'PURCHASE_REVERSAL',
        referenceType: 'PURCHASE_BILL_CANCELLATION',
        referenceId: purchaseId,
        quantityIn: 0,
        quantityOut: movement.quantityIn,
        rate: movement.rate,
        movementDate: new Date(),
        remarks: `Reversal of movement ${movement.id}`,
      };

      this.stockMovementRepo.createMovementSync(payload, tx);
      this.applyMovementToBalanceSync(
        payload.companyId,
        payload.financialYearId,
        payload.productId,
        0,
        payload.quantityOut,
        payload.rate,
        tx,
      );
    }
  }

  public getWacForProductSync(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx: TransactionExecutor,
  ): { wac: number; totalQty: number } {
    const balance = this.balanceRepo.getBalanceSync(companyId, financialYearId, productId, tx);
    if (!balance) return { wac: 0, totalQty: 0 };
    return { wac: balance.currentWacPaise, totalQty: balance.currentQty };
  }

  public postOutboundSync(
    data: CreateStockMovementInput,
    tx: TransactionExecutor,
  ): { movementId: string; wacApplied: number } {
    if (data.quantityOut <= 0) {
      throw new Error('Outbound quantity must be > 0');
    }

    const { wac, totalQty } = this.getWacForProductSync(
      data.companyId,
      data.financialYearId,
      data.productId,
      tx,
    );

    if (totalQty < data.quantityOut) {
      throw new StockValidationError([
        `Insufficient stock for product ${data.productId}. Available: ${totalQty}, Requested: ${data.quantityOut}`,
      ]);
    }

    const payload: CreateStockMovementInput = {
      ...data,
      quantityIn: 0,
      rate: wac,
    };

    const { movementId } = this.stockMovementRepo.createMovementSync(payload, tx);
    this.applyMovementToBalanceSync(
      data.companyId,
      data.financialYearId,
      data.productId,
      0,
      data.quantityOut,
      wac,
      tx,
    );

    return { movementId, wacApplied: wac };
  }

  public reverseSalesInvoiceSync(invoiceId: string, tx: TransactionExecutor): void {
    const originalMovements = this.stockMovementRepo.getMovementsByReferenceSync(
      'SALES_INVOICE',
      invoiceId,
      tx,
    );
    if (originalMovements.length === 0)
      throw new Error(`No inventory movements found for Sales Invoice ${invoiceId}`);

    for (const movement of originalMovements) {
      if (movement.quantityOut <= 0) continue;

      const payload: CreateStockMovementInput = {
        companyId: movement.companyId,
        financialYearId: movement.financialYearId,
        productId: movement.productId,
        movementType: 'SALE_REVERSAL',
        referenceType: 'SALES_INVOICE_CANCELLATION',
        referenceId: invoiceId,
        quantityIn: movement.quantityOut,
        quantityOut: 0,
        rate: movement.rate,
        movementDate: new Date(),
        remarks: `Reversal of movement ${movement.id}`,
      };

      this.stockMovementRepo.createMovementSync(payload, tx);
      this.applyMovementToBalanceSync(
        payload.companyId,
        payload.financialYearId,
        payload.productId,
        payload.quantityIn,
        0,
        payload.rate,
        tx,
      );
    }
  }
}

export const inventoryEngine = new InventoryEngine();
