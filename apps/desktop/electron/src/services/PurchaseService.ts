import { randomUUID } from 'crypto';

import { suppliers, products, units, taxes } from '@vyora/database';
import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  SearchPurchasesOptions,
  PurchaseDto,
  PurchaseListDto,
  createPurchaseSchema,
  updatePurchaseSchema,
} from '@vyora/types';
import { eq } from 'drizzle-orm';

import { PurchaseRepository } from '../repositories/PurchaseRepository';

import { companyContextService } from './CompanyContextService';
import { documentNumberingService } from './DocumentNumberingService';
import { inventoryEngine } from './InventoryEngine';
import { journalService } from './JournalService';

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;

  constructor() {
    this.purchaseRepo = new PurchaseRepository();
  }

  public async create(payload: CreatePurchaseInput): Promise<string> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    // Strict schema validation
    const parsedPayload = createPurchaseSchema.parse(payload);

    return this.purchaseRepo.transaction((tx) => {
      // Generate Number
      const purchaseNumber = documentNumberingService.generateNextNumberSync(
        companyId,
        'PURCHASE_INVOICE' as import('@vyora/types').DocumentType,
        parsedPayload.financialYearId,
        tx as import('../repositories/BaseRepository').TransactionExecutor,
      );

      // Fetch Supplier Snapshot
      const supplier = tx
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, parsedPayload.supplierId))
        .get();

      if (!supplier) throw new Error('Invalid supplier ID');

      const id = randomUUID();
      const now = new Date();

      const headerPayload = {
        ...parsedPayload,
        id,
        companyId,
        purchaseNumber,
        supplierName: supplier.name,
        supplierGstin: supplier.gstin,
        status: 'DRAFT' as const, // Force DRAFT initially
        isActive: true,
        createdAt: now,
        updatedAt: now,
        syncVersion: 1,
      };

      // Process Lines and Fetch Snapshots
      const linesPayload = [];
      for (const line of parsedPayload.lines) {
        const item = tx.select().from(products).where(eq(products.id, line.productId)).get();
        if (!item) throw new Error(`Invalid item ID: ${line.productId}`);

        const unit = tx.select().from(units).where(eq(units.id, line.unitId)).get();
        if (!unit) throw new Error(`Invalid unit ID: ${line.unitId}`);

        const tax = tx.select().from(taxes).where(eq(taxes.id, line.taxId)).get();
        if (!tax) throw new Error(`Invalid tax ID: ${line.taxId}`);

        linesPayload.push({
          ...line,
          id: randomUUID(),
          itemName: item.name,
          itemCode: item.sku,
          unitShortName: unit.shortName,
          taxPercentage: tax.rate,
          hsnCode: item.hsnCode,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          syncVersion: 1,
        });
      }

      this.purchaseRepo.createSync(companyId, headerPayload, linesPayload, tx);

      return id;
    });
  }

  public async updateDraft(payload: UpdatePurchaseInput): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    const parsedPayload = updatePurchaseSchema.parse(payload);

    if (parsedPayload.status && parsedPayload.status !== 'DRAFT') {
      throw new Error('Cannot change status during updateDraft. Use submit or cancel actions.');
    }

    return this.purchaseRepo.transaction((tx) => {
      const existing = this.purchaseRepo.getByIdSync(parsedPayload.id, companyId, tx);
      if (!existing) throw new Error('Purchase Invoice not found');
      if (existing.status !== 'DRAFT')
        throw new Error(`Cannot update invoice in status ${existing.status}`);

      const { id, lines, ...headerUpdates } = parsedPayload;

      let processedLines: Partial<PurchaseDto['lines'][0]>[] | undefined = undefined;

      if (lines) {
        processedLines = [];
        for (const line of lines) {
          let itemName: string | undefined = undefined;
          let itemCode: string | null | undefined = undefined;
          let unitShortName: string | undefined = undefined;
          let taxPercentage: number | undefined = undefined;
          let hsnCode: string | null | undefined = undefined;

          const existingLine = line.id ? existing.lines.find((l) => l.id === line.id) : undefined;

          const isNewProduct =
            !existingLine ||
            (line.productId !== undefined && line.productId !== existingLine.productId);
          if (isNewProduct) {
            const pId = line.productId || existingLine?.productId;
            if (pId) {
              const item = tx.select().from(products).where(eq(products.id, pId)).get();
              if (item) {
                itemName = item.name;
                itemCode = item.sku;
                hsnCode = item.hsnCode;
              }
            }
          }

          const isNewUnit =
            !existingLine || (line.unitId !== undefined && line.unitId !== existingLine.unitId);
          if (isNewUnit) {
            const uId = line.unitId || existingLine?.unitId;
            if (uId) {
              const unit = tx.select().from(units).where(eq(units.id, uId)).get();
              if (unit) {
                unitShortName = unit.shortName;
              }
            }
          }

          const isNewTax =
            !existingLine || (line.taxId !== undefined && line.taxId !== existingLine.taxId);
          if (isNewTax) {
            const tId = line.taxId || existingLine?.taxId;
            if (tId) {
              const tax = tx.select().from(taxes).where(eq(taxes.id, tId)).get();
              if (tax) {
                taxPercentage = tax.rate;
              }
            }
          }

          const processedLine: Record<string, unknown> = { ...line };
          if (itemName !== undefined) processedLine.itemName = itemName;
          if (itemCode !== undefined) processedLine.itemCode = itemCode;
          if (unitShortName !== undefined) processedLine.unitShortName = unitShortName;
          if (taxPercentage !== undefined) processedLine.taxPercentage = taxPercentage;
          if (hsnCode !== undefined) processedLine.hsnCode = hsnCode;

          processedLines.push(processedLine as Partial<PurchaseDto['lines'][0]>);
        }
      }

      this.purchaseRepo.updateSync(id, companyId, headerUpdates, processedLines, tx);
    });
  }

  public async submitPurchase(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    return this.purchaseRepo.transaction((tx) => {
      const invoice = this.purchaseRepo.getByIdSync(id, companyId, tx);
      if (!invoice) throw new Error(`Purchase Invoice not found: ${id}`);

      if (invoice.status === 'SUBMITTED') throw new Error('Invoice is already submitted');
      if (invoice.status === 'CANCELLED') throw new Error('Cannot submit a cancelled invoice');
      if (invoice.status !== 'DRAFT')
        throw new Error(`Invalid status for submission: ${invoice.status}`);

      if (!invoice.lines || invoice.lines.length === 0) {
        throw new Error('Cannot submit invoice without items');
      }

      const totalCgst = 0;
      const totalSgst = 0;
      let totalIgst = 0;

      for (const line of invoice.lines) {
        inventoryEngine.postInboundSync(
          {
            companyId,
            financialYearId: invoice.financialYearId,
            productId: line.productId,
            movementType: 'PURCHASE',
            referenceType: 'PURCHASE_BILL',
            referenceId: id,
            quantityIn: line.quantity,
            quantityOut: 0,
            rate: line.rate,
            movementDate: invoice.purchaseDate,
            remarks: line.description || '',
          },
          tx,
        );
        totalIgst += line.taxAmount; // Simplify taxes as IGST for now, or calculate properly if needed
      }

      journalService.postPurchaseBillSync(
        {
          companyId,
          financialYearId: invoice.financialYearId,
          invoiceId: id,
          invoiceDate: invoice.purchaseDate,
          supplierId: invoice.supplierId,
          totalTaxableAmount: invoice.subtotal - (invoice.discountAmount || 0),
          totalCgst,
          totalSgst,
          totalIgst,
          totalInvoiceAmount: invoice.grandTotal,
          roundOffAmount: invoice.roundOffAmount || 0,
        },
        tx,
      );

      this.purchaseRepo.updateStatusSync(id, companyId, 'SUBMITTED', tx);
    });
  }

  public async cancelPurchase(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    await this.purchaseRepo.transaction((tx) => {
      const existing = this.purchaseRepo.getByIdSync(id, companyId, tx);
      if (!existing) throw new Error('Purchase Invoice not found');
      if (existing.status === 'CANCELLED') throw new Error('Purchase Invoice already cancelled');

      if (existing.status === 'SUBMITTED') {
        inventoryEngine.reversePurchaseInvoiceSync(id, tx);
        journalService.reversePurchaseBillSync(id, tx);
      }

      this.purchaseRepo.updateStatusSync(id, companyId, 'CANCELLED', tx);
    });
  }

  // Legacy delete method mapped to cancelPurchase for frontend compatibility
  public async delete(id: string): Promise<void> {
    return this.cancelPurchase(id);
  }

  public async getById(id: string): Promise<PurchaseDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    return this.purchaseRepo.getById(id, companyId);
  }

  public async search(options: SearchPurchasesOptions): Promise<PurchaseListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    return this.purchaseRepo.search(companyId, options);
  }
}

export const purchaseService = new PurchaseService();
