import {
  CreateSalesInvoiceInput,
  UpdateSalesInvoiceInput,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  DocumentType,
  RecordPaymentInput,
} from '@vyora/types';

import {
  SalesInvoiceRepository,
  StockMovementRepository,
  ProductRepository,
  companyRepository,
} from '../repositories';
import { DbTransaction } from '../repositories/BaseRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { inventoryEngine } from './InventoryEngine';
import { journalService } from './JournalService';
import { paymentResolutionService } from './PaymentResolutionService';
import { settlementService } from './SettlementService';

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
  private productRepo = new ProductRepository();

  public async createInvoice(data: CreateSalesInvoiceInput): Promise<{ invoiceId: string }> {
    if (data.status && !['DRAFT', 'SUBMITTED', 'CANCELLED'].includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }

    // Force default status to DRAFT
    const invoiceData = { ...data, status: 'DRAFT' as const };

    return dbService.getDb().transaction((tx) => {
      this.resolvePaymentSnapshotsSync(
        invoiceData.companyId,
        invoiceData.customerId,
        invoiceData,
        tx,
      );
      const { invoiceId } = this.salesInvoiceRepo.createInvoiceSync(invoiceData, tx);
      return { invoiceId };
    });
  }

  public async getInvoiceById(invoiceId: string): Promise<SalesInvoiceDto | null> {
    return this.salesInvoiceRepo.getById(invoiceId);
  }

  public async listInvoices(
    options?: ListSalesInvoicesOptions,
  ): Promise<import('@vyora/types').SalesInvoiceListDto> {
    return this.salesInvoiceRepo.list(options);
  }

  public async updateDraft(
    invoiceId: string,
    payload: UpdateSalesInvoiceInput,
    pin?: string,
  ): Promise<SalesInvoiceDto> {
    const existing = await this.salesInvoiceRepo.getById(invoiceId);
    if (!existing) throw new Error(`Invoice not found: ${invoiceId}`);

    if (existing.status === 'CANCELLED') {
      throw new Error('Cannot update a cancelled invoice.');
    }

    if (existing.status === 'SUBMITTED') {
      if (!pin) throw new Error('PIN is required to edit a submitted invoice.');
      const isValid = await authService.verifyActionPin(pin);
      if (!isValid) throw new Error('Invalid PIN provided.');
    }

    if (payload.status && payload.status !== existing.status) {
      if (!(existing.status === 'SUBMITTED' && payload.status === 'DRAFT' && pin)) {
        throw new Error('Cannot change status during update. Use submit or cancel actions.');
      }
    }

    // Ensure invoice number cannot be changed if submitted
    if (
      existing.status === 'SUBMITTED' &&
      payload.invoiceNumber &&
      payload.invoiceNumber !== existing.invoiceNumber
    ) {
      throw new Error('Invoice number cannot be changed after submission.');
    }

    dbService.getDb().transaction((tx) => {
      if (['SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(existing.status)) {
        // Reverse inventory and journal before updating
        inventoryEngine.reverseSalesInvoiceSync(invoiceId, tx);
        journalService.reverseSalesInvoiceSync(invoiceId, tx);
      }

      // Re-resolve snapshots for drafts on update (if customer/company might have changed settings)
      const customerId = payload.customerId || existing.customerId;
      this.resolvePaymentSnapshotsSync(existing.companyId, customerId, payload, tx);

      this.salesInvoiceRepo.updateInvoiceSync(invoiceId, payload, tx);

      if (['SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(existing.status)) {
        // Re-submit the updated invoice
        this.submitInvoiceInnerSync(invoiceId, tx, true); // true = skip document numbering
      }
    });

    const updated = await this.salesInvoiceRepo.getById(invoiceId);
    if (!updated) throw new Error('Failed to retrieve updated invoice');
    return updated;
  }

  private submitInvoiceInnerSync(
    invoiceId: string,
    tx: DbTransaction,
    skipDocumentNumber = false,
  ): void {
    const invoice = this.salesInvoiceRepo.getByIdSync(invoiceId, tx);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

    if (!skipDocumentNumber && invoice.status === 'SUBMITTED')
      throw new Error('Invoice is already submitted');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot submit a cancelled invoice');
    if (!skipDocumentNumber && invoice.status !== 'DRAFT')
      throw new Error(`Invalid status for submission: ${invoice.status}`);

    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Cannot submit invoice without items');
    }

    // Finalize Payment & QR Snapshots
    const updatePayload: Record<string, unknown> = {};
    this.resolvePaymentSnapshotsSync(invoice.companyId, invoice.customerId, updatePayload, tx);
    this.salesInvoiceRepo.updateInvoiceSync(invoiceId, updatePayload, tx);
    // Merge into local object to use below if needed
    Object.assign(invoice, updatePayload);

    let totalCogsAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of invoice.items) {
      const product = this.productRepo.getByIdSync(item.productId, invoice.companyId, tx);
      if (!product) {
        throw new Error(`Product not found for item: ${item.productId}`);
      }
      if (product.itemType === 'SERVICE' || product.itemType === 'NON_INVENTORY_ITEM') {
        continue; // Services and non-inventory items do not have stock movements
      }

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

      totalCgst += item.cgstAmount || 0;
      totalSgst += item.sgstAmount || 0;
      totalIgst += item.igstAmount || 0;
    }

    if (totalCgst === 0 && totalSgst === 0 && totalIgst === 0 && invoice.taxAmount > 0) {
      totalIgst = invoice.taxAmount;
    }

    journalService.postSalesInvoiceSync(
      {
        companyId: invoice.companyId,
        financialYearId: invoice.financialYearId,
        invoiceId,
        invoiceDate: invoice.invoiceDate,
        customerId: invoice.customerId,
        totalTaxableAmount: invoice.subtotal - invoice.discountAmount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalInvoiceAmount: invoice.grandTotal,
        totalCogsAmount,
      },
      tx,
    );

    this.salesInvoiceRepo.updateStatusSync(invoiceId, 'SUBMITTED', tx);

    // Generate document number
    if (!skipDocumentNumber) {
      const nextNumber = documentNumberingService.generateNextNumberSync(
        invoice.companyId,
        DocumentType.SALES_INVOICE,
        invoice.financialYearId,
        tx,
      );
      this.salesInvoiceRepo.finalizeInvoiceNumberSync(invoiceId, nextNumber, tx);
    }
  }

  public async submitInvoice(invoiceId: string): Promise<{ warnings: unknown[] }> {
    return dbService.getDb().transaction((tx) => {
      this.submitInvoiceInnerSync(invoiceId, tx, false);
      return { warnings: [] };
    });
  }

  public async cancelInvoice(invoiceId: string): Promise<void> {
    dbService.getDb().transaction((tx) => {
      const invoice = this.salesInvoiceRepo.getByIdSync(invoiceId, tx);
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'CANCELLED') throw new Error('Invoice already cancelled');

      if (['SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.status)) {
        // Reverse inventory using the new generic cancellation method
        inventoryEngine.reverseSalesInvoiceSync(invoiceId, tx);

        // Reverse journal
        journalService.reverseSalesInvoiceSync(invoiceId, tx);
      }

      // Mark as cancelled
      this.salesInvoiceRepo.updateStatusSync(invoiceId, 'CANCELLED', tx);
    });
  }

  private resolvePaymentSnapshotsSync(
    companyId: string,
    customerId: string,
    payload: Record<string, unknown>,
    tx: DbTransaction,
  ) {
    const paymentAccount = paymentResolutionService.resolvePaymentDestinationSync(
      customerId,
      companyId,
      tx,
    );
    if (paymentAccount) {
      payload.paymentAccountId = paymentAccount.id;
      payload.bankNameSnapshot = paymentAccount.bankName;
      payload.accountNumberSnapshot = paymentAccount.accountNumber;
      payload.ifscCodeSnapshot = paymentAccount.ifscCode;
      payload.branchNameSnapshot = paymentAccount.branchName;
    } else {
      payload.paymentAccountId = null;
      payload.bankNameSnapshot = null;
      payload.accountNumberSnapshot = null;
      payload.ifscCodeSnapshot = null;
      payload.branchNameSnapshot = null;
    }

    const qrAccount = paymentResolutionService.resolveQrDestinationSync(customerId, companyId, tx);
    if (qrAccount) {
      payload.qrAccountId = qrAccount.id;
      payload.upiIdSnapshot = qrAccount.upiId;
      payload.upiPayeeNameSnapshot = qrAccount.merchantName;
    } else {
      const company = companyRepository.getByIdSync(companyId, tx);
      payload.qrAccountId = null;
      payload.upiIdSnapshot = company?.defaultUpiId || null;
      payload.upiPayeeNameSnapshot = company?.upiPayeeName || null;
    }

    const signature = paymentResolutionService.resolveSignatureDestinationSync(
      customerId,
      companyId,
      tx,
    );
    if (signature) {
      payload.signatureId = signature.id;
    } else {
      payload.signatureId = null;
    }
  }

  public async recordPayment(
    invoiceId: string,
    payload: RecordPaymentInput,
  ): Promise<{ settlementId: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const invoice = await this.salesInvoiceRepo.getById(invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

    if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
      throw new Error(`Cannot record payment for invoice in ${invoice.status} status.`);
    }

    // Delegate to settlement service which handles everything in one transaction
    return settlementService.createSettlement({
      settlementDate: payload.paymentDate,
      partyType: 'CUSTOMER',
      partyId: invoice.customerId,
      amount: payload.amount,
      paymentMode: payload.paymentMode,
      paymentAccountId: payload.paymentAccountId,
      referenceNumber: payload.referenceNumber,
      referenceDate: payload.referenceDate,
      notes: payload.notes,
      allocations: [
        {
          documentType: 'SALES_INVOICE',
          documentId: invoiceId,
          allocatedAmount: payload.amount,
        },
      ],
    });
  }
}

export const salesInvoiceService = new SalesInvoiceService();
