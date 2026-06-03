import {
  PurchaseInvoiceRepository,
  StockMovementRepository,
  CreatePurchaseInvoiceInput,
} from '../repositories';

import { dbService } from './database/DatabaseService';

export class PurchaseInvoiceService {
  private purchaseInvoiceRepo = new PurchaseInvoiceRepository();
  private stockMovementRepo = new StockMovementRepository();

  public async createInvoice(data: CreatePurchaseInvoiceInput): Promise<{ invoiceId: string }> {
    return await dbService.getDb().transaction(async (tx) => {
      const { invoiceId } = await this.purchaseInvoiceRepo.createInvoice(data, tx);

      for (const item of data.items) {
        await this.stockMovementRepo.createMovement(
          {
            companyId: data.companyId,
            financialYearId: data.financialYearId,
            productId: item.productId,
            movementType: 'PURCHASE',
            referenceType: 'PURCHASE_INVOICE',
            referenceId: invoiceId,
            quantityIn: item.quantity,
            quantityOut: 0,
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

export const purchaseInvoiceService = new PurchaseInvoiceService();
