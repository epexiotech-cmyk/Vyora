import { randomUUID } from 'crypto';

import { suppliers, products, units, taxes, purchase_invoices } from '@vyora/database';
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
import { inventoryEngine } from './InventoryEngine';
import { journalService } from './JournalService';
import { numberingEngineService } from './NumberingEngineService';

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

    return this.purchaseRepo.transaction(async (tx) => {
      // Generate Number
      const purchaseNumber = await numberingEngineService.generateNextNumber(
        companyId,
        parsedPayload.financialYearId,
        'PURCHASE_INVOICE',
        tx,
      );

      // Fetch Supplier Snapshot
      const supplier = await tx
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
        status: parsedPayload.status ?? 'DRAFT',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        syncVersion: 1,
      };

      // Process Lines and Fetch Snapshots
      const linesPayload = [];
      for (const line of parsedPayload.lines) {
        // Fetch Item Snapshot
        const item = await tx.select().from(products).where(eq(products.id, line.productId)).get();
        if (!item) throw new Error(`Invalid item ID: ${line.productId}`);

        // Fetch Unit Snapshot
        const unit = await tx.select().from(units).where(eq(units.id, line.unitId)).get();
        if (!unit) throw new Error(`Invalid unit ID: ${line.unitId}`);

        // Fetch Tax Snapshot
        const tax = await tx.select().from(taxes).where(eq(taxes.id, line.taxId)).get();
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

      await this.purchaseRepo.create(companyId, headerPayload, linesPayload, tx);

      const totalCgst = 0;
      const totalSgst = 0;
      let totalIgst = 0;

      for (const line of linesPayload) {
        await inventoryEngine.postInbound(
          {
            companyId,
            financialYearId: parsedPayload.financialYearId,
            productId: line.productId,
            movementType: 'PURCHASE',
            referenceType: 'PURCHASE_BILL',
            referenceId: id,
            quantityIn: line.quantity,
            quantityOut: 0,
            rate: line.rate,
            movementDate: new Date(),
            remarks: line.description || '',
          },
          tx,
        );
        totalIgst += line.taxAmount;
      }

      await journalService.postPurchaseBill(
        {
          companyId,
          financialYearId: parsedPayload.financialYearId,
          invoiceId: id,
          invoiceDate: new Date(),
          supplierId: parsedPayload.supplierId,
          totalTaxableAmount: parsedPayload.subtotal - (parsedPayload.discountAmount || 0),
          totalCgst,
          totalSgst,
          totalIgst,
          totalInvoiceAmount: parsedPayload.grandTotal,
          roundOffAmount: parsedPayload.roundOffAmount || 0,
        },
        tx,
      );

      return id;
    });
  }

  public async update(payload: UpdatePurchaseInput): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    const parsedPayload = updatePurchaseSchema.parse(payload);

    return this.purchaseRepo.transaction(async (tx) => {
      const existing = await this.purchaseRepo.getById(parsedPayload.id, companyId);
      if (!existing) throw new Error('Purchase Invoice not found');

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

          // Product Snapshot
          const isNewProduct =
            !existingLine ||
            (line.productId !== undefined && line.productId !== existingLine.productId);
          if (isNewProduct) {
            const pId = line.productId || existingLine?.productId;
            if (pId) {
              const item = await tx.select().from(products).where(eq(products.id, pId)).get();
              if (item) {
                itemName = item.name;
                itemCode = item.sku;
                hsnCode = item.hsnCode;
              }
            }
          }

          // Unit Snapshot
          const isNewUnit =
            !existingLine || (line.unitId !== undefined && line.unitId !== existingLine.unitId);
          if (isNewUnit) {
            const uId = line.unitId || existingLine?.unitId;
            if (uId) {
              const unit = await tx.select().from(units).where(eq(units.id, uId)).get();
              if (unit) {
                unitShortName = unit.shortName;
              }
            }
          }

          // Tax Snapshot
          const isNewTax =
            !existingLine || (line.taxId !== undefined && line.taxId !== existingLine.taxId);
          if (isNewTax) {
            const tId = line.taxId || existingLine?.taxId;
            if (tId) {
              const tax = await tx.select().from(taxes).where(eq(taxes.id, tId)).get();
              if (tax) {
                taxPercentage = tax.rate;
              }
            }
          }

          const processedLine: Record<string, unknown> = {
            ...line,
          };
          if (itemName !== undefined) processedLine.itemName = itemName;
          if (itemCode !== undefined) processedLine.itemCode = itemCode;
          if (unitShortName !== undefined) processedLine.unitShortName = unitShortName;
          if (taxPercentage !== undefined) processedLine.taxPercentage = taxPercentage;
          if (hsnCode !== undefined) processedLine.hsnCode = hsnCode;

          processedLines.push(processedLine as Partial<PurchaseDto['lines'][0]>);
        }
      }

      await this.purchaseRepo.update(id, companyId, headerUpdates, processedLines, tx);
    });
  }

  public async getById(id: string): Promise<PurchaseDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    return this.purchaseRepo.getById(id, companyId);
  }

  public async search(options: SearchPurchasesOptions): Promise<PurchaseListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    const result = await this.purchaseRepo.search(companyId, options);
    return result;
  }

  public async delete(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const existing = await this.purchaseRepo.getById(id, companyId);
    if (!existing) throw new Error('Purchase Invoice not found');
    if (existing.status === 'CANCELLED') throw new Error('Purchase Invoice already cancelled');

    await this.purchaseRepo.transaction(async (tx) => {
      // 1. Inventory Reversal
      for (const line of existing.lines) {
        await inventoryEngine.processPurchaseReturn(
          'PURCHASE_BILL',
          id,
          line.productId,
          line.quantity,
          tx,
        );
      }

      // 2. Accounting Reversal
      await journalService.reversePurchaseBill(id, tx);

      // 3. Status Cancellation
      await tx
        .update(purchase_invoices)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(purchase_invoices.id, id));
    });
  }
}

export const purchaseService = new PurchaseService();
