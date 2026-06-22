import { CreateSalesInvoiceInput } from '@vyora/types';

import { SalesInvoiceRepository, StockMovementRepository } from '../repositories';

import { dbService } from './database/DatabaseService';
import { inventoryService } from './InventoryService';

export class StockValidationError extends Error {
  public validations: unknown[] = [];
  constructor(validations: unknown[]) {
    super('Stock validation failed');
    this.name = 'StockValidationError';
    this.validations = validations;
  }
}

export class SalesInvoiceService {
  private salesInvoiceRepo = new SalesInvoiceRepository();
  private stockMovementRepo = new StockMovementRepository();

  public async createInvoice(data: CreateSalesInvoiceInput): Promise<{ invoiceId: string }> {
    for (const item of data.items) {
      const { available, currentStock } = await inventoryService.checkStockAvailability(
        item.productId,
        item.quantity,
      );

      if (!available) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. Available: ${currentStock}`,
        );
      }
    }

    return await dbService.getDb().transaction(async (tx) => {
      const { invoiceId } = await this.salesInvoiceRepo.createInvoice(data, tx);

      for (const item of data.items) {
        await this.stockMovementRepo.createMovement(
          {
            companyId: data.companyId,
            financialYearId: data.financialYearId,
            productId: item.productId,
            movementType: 'SALE',
            referenceType: 'SALES_INVOICE',
            referenceId: invoiceId,
            quantityIn: 0,
            quantityOut: item.quantity,
            rate: item.rate,
            movementDate: data.invoiceDate,
            remarks: item.description,
          },
          tx,
        );
      }

      return { invoiceId };
    });
  }

  public async getInvoiceById(_invoiceId?: string): Promise<void> {
    throw new Error('Not implemented');
  }

  public async listInvoices(_options?: unknown): Promise<void> {
    throw new Error('Not implemented');
  }

  public async updateDraft(_invoiceId: string, _payload: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  }

  public async submitInvoice(_invoiceId: string): Promise<{ warnings: unknown[] }> {
    throw new Error('Not implemented');
  }

  public async cancelInvoice(_invoiceId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const salesInvoiceService = new SalesInvoiceService();
