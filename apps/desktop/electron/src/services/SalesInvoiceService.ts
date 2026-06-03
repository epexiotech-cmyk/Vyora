import {
  SalesInvoiceRepository,
  StockMovementRepository,
  CreateSalesInvoiceInput,
} from '../repositories';

import { dbService } from './database/DatabaseService';
import { inventoryService } from './InventoryService';

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

  public async getInvoiceById(): Promise<void> {
    throw new Error('Not implemented');
  }

  public async listInvoices(): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const salesInvoiceService = new SalesInvoiceService();
