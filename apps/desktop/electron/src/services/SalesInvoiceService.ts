import {
  CreateSalesInvoiceInput,
  UpdateSalesInvoiceInput,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  DocumentType,
} from '@vyora/types';

import { SalesInvoiceRepository, StockMovementRepository } from '../repositories';

import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { inventoryEngine } from './InventoryEngine';
import { journalService } from './JournalService';

export class StockValidationError extends Error {
  public validations: unknown[] = [];
  constructor(validations: unknown[]) {
    const details = Array.isArray(validations) ? validations.join(', ') : 'Unknown reason';
    super(`Stock validation failed: ${details}`);
    this.name = 'StockValidationError';
    this.validations = validations;
  }
}

export class SalesInvoiceService {
  private salesInvoiceRepo = new SalesInvoiceRepository();
  private stockMovementRepo = new StockMovementRepository();

  public async createInvoice(data: CreateSalesInvoiceInput): Promise<{ invoiceId: string }> {
    if (data.status && !['DRAFT', 'SUBMITTED', 'CANCELLED'].includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }

    // Force default status to DRAFT
    const invoiceData = { ...data, status: 'DRAFT' as const };

    return dbService.getDb().transaction((tx) => {
      const { invoiceId } = this.salesInvoiceRepo.createInvoiceSync(invoiceData, tx);
      return { invoiceId };
    });
  }

  public async getInvoiceById(invoiceId: string): Promise<SalesInvoiceDto | null> {
    return this.salesInvoiceRepo.getById(invoiceId);
  }

  public async listInvoices(options?: ListSalesInvoicesOptions): Promise<SalesInvoiceDto[]> {
    return this.salesInvoiceRepo.list(options);
  }

  public async updateDraft(
    invoiceId: string,
    payload: UpdateSalesInvoiceInput,
  ): Promise<SalesInvoiceDto> {
    const existing = await this.salesInvoiceRepo.getById(invoiceId);
    if (!existing) throw new Error(`Invoice not found: ${invoiceId}`);
    if (existing.status !== 'DRAFT') {
      throw new Error(`Cannot update invoice in status ${existing.status}`);
    }

    if (payload.status && payload.status !== 'DRAFT') {
      throw new Error('Cannot change status during updateDraft. Use submit or cancel actions.');
    }

    dbService.getDb().transaction((tx) => {
      this.salesInvoiceRepo.updateInvoiceSync(invoiceId, payload, tx);
    });

    const updated = await this.salesInvoiceRepo.getById(invoiceId);
    if (!updated) throw new Error('Failed to retrieve updated invoice');
    return updated;
  }

  public async submitInvoice(invoiceId: string): Promise<{ warnings: unknown[] }> {
    return dbService.getDb().transaction((tx) => {
      const invoice = this.salesInvoiceRepo.getByIdSync(invoiceId, tx);
      if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

      if (invoice.status === 'SUBMITTED') throw new Error('Invoice is already submitted');
      if (invoice.status === 'CANCELLED') throw new Error('Cannot submit a cancelled invoice');
      if (invoice.status !== 'DRAFT')
        throw new Error(`Invalid status for submission: ${invoice.status}`);

      if (!invoice.items || invoice.items.length === 0) {
        throw new Error('Cannot submit invoice without items');
      }

      let totalCogsAmount = 0;
      for (const item of invoice.items) {
        const { wacApplied } = inventoryEngine.postOutboundSync(
          {
            companyId: invoice.companyId,
            financialYearId: invoice.financialYearId,
            productId: item.productId,
            movementType: 'SALE',
            referenceType: 'SALES_INVOICE',
            referenceId: invoiceId,
            quantityIn: 0,
            quantityOut: item.quantity,
            rate: item.rate,
            movementDate: invoice.invoiceDate,
            remarks: item.description || '',
          },
          tx,
        );
        totalCogsAmount += wacApplied * item.quantity;
      }

      journalService.postSalesInvoiceSync(
        {
          companyId: invoice.companyId,
          financialYearId: invoice.financialYearId,
          invoiceId,
          invoiceDate: invoice.invoiceDate,
          customerId: invoice.customerId,
          totalTaxableAmount: invoice.subtotal - invoice.discountAmount,
          totalCgst: 0,
          totalSgst: 0,
          totalIgst: invoice.taxAmount,
          totalInvoiceAmount: invoice.grandTotal,
          totalCogsAmount,
        },
        tx,
      );

      this.salesInvoiceRepo.updateStatusSync(invoiceId, 'SUBMITTED', tx);

      // Generate document number
      const nextNumber = documentNumberingService.generateNextNumberSync(
        invoice.companyId,
        DocumentType.SALES_INVOICE,
        invoice.financialYearId,
        tx,
      );
      this.salesInvoiceRepo.finalizeInvoiceNumberSync(invoiceId, nextNumber, tx);

      return { warnings: [] };
    });
  }

  public async cancelInvoice(invoiceId: string): Promise<void> {
    dbService.getDb().transaction((tx) => {
      const invoice = this.salesInvoiceRepo.getByIdSync(invoiceId, tx);
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'CANCELLED') throw new Error('Invoice already cancelled');

      if (invoice.status === 'SUBMITTED') {
        // Reverse inventory using the new generic cancellation method
        inventoryEngine.reverseSalesInvoiceSync(invoiceId, tx);

        // Reverse journal
        journalService.reverseSalesInvoiceSync(invoiceId, tx);
      }

      // Mark as cancelled
      this.salesInvoiceRepo.updateStatusSync(invoiceId, 'CANCELLED', tx);
    });
  }
}

export const salesInvoiceService = new SalesInvoiceService();
