import { sales_invoices } from '@vyora/database';
import { CreateSalesInvoiceInput } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { SalesInvoiceRepository, StockMovementRepository } from '../repositories';

import { dbService } from './database/DatabaseService';
import { inventoryEngine } from './InventoryEngine';
import { inventoryService } from './InventoryService';
import { journalService } from './JournalService';

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

      let totalCogsAmount = 0;
      for (const item of data.items) {
        const { wacApplied } = await inventoryEngine.postOutbound(
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
            remarks: item.description || '',
          },
          tx,
        );
        totalCogsAmount += wacApplied * item.quantity;
      }

      await journalService.postSalesInvoice(
        {
          companyId: data.companyId,
          financialYearId: data.financialYearId,
          invoiceId,
          invoiceDate: data.invoiceDate,
          customerId: data.customerId,
          totalTaxableAmount: data.subtotal - data.discountAmount,
          totalCgst: 0,
          totalSgst: 0,
          totalIgst: data.taxAmount,
          totalInvoiceAmount: data.grandTotal,
          totalCogsAmount,
        },
        tx,
      );

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

  public async cancelInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.salesInvoiceRepo.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice already cancelled');

    await dbService.getDb().transaction(async (tx) => {
      if (invoice.items) {
        for (const item of invoice.items) {
          await inventoryEngine.processSalesReturn(
            'SALES_INVOICE',
            invoiceId,
            item.productId,
            item.quantity,
            tx,
          );
        }
      }

      await journalService.reverseSalesInvoice(invoiceId, tx);

      await tx
        .update(sales_invoices)
        .set({ status: 'CANCELLED' })
        .where(eq(sales_invoices.id, invoiceId))
        .run();
    });
  }
}

export const salesInvoiceService = new SalesInvoiceService();
