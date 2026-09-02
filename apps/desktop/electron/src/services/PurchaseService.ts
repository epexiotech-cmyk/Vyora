import { randomUUID } from 'crypto';

import { suppliers, products, units, taxes, expense_presets } from '@vyora/database';
import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  SearchPurchasesOptions,
  PurchaseDto,
  PurchaseListDto,
  createPurchaseSchema,
  updatePurchaseSchema,
  RecordPaymentInput,
} from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { ProductRepository } from '../repositories';
import { PurchaseRepository } from '../repositories/PurchaseRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { systemSupplierSeeder } from './database/SystemSupplierSeeder';
import { documentNumberingService } from './DocumentNumberingService';
import { inventoryEngine } from './InventoryEngine';
import { journalService } from './JournalService';
import { settlementService } from './SettlementService';

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;
  private productRepo: ProductRepository;

  constructor() {
    this.purchaseRepo = new PurchaseRepository();
    this.productRepo = new ProductRepository();
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

      // Invariants check
      const docType = parsedPayload.documentType || 'PURCHASE';

      if (docType === 'PURCHASE') {
        if (!parsedPayload.supplierId) throw new Error('PURCHASE document requires a supplierId');
        if (parsedPayload.paymentAccountId)
          throw new Error('PURCHASE document cannot have a paymentAccountId');
      } else {
        if (!parsedPayload.supplierId && !parsedPayload.paymentAccountId) {
          throw new Error('EXPENSE document must have either a supplierId or a paymentAccountId');
        }
      }

      // Fetch Supplier Snapshot (if present) or System Supplier
      let supplierName = 'CASH';
      let supplierGstin: string | null = null;
      let resolvedSupplierId = parsedPayload.supplierId || null;

      if (docType === 'EXPENSE' && parsedPayload.isMiscellaneous) {
        const sysSupplier = systemSupplierSeeder.getOrCreateMiscellaneousSupplierSync(
          companyId,
          tx as import('../repositories/BaseRepository').TransactionExecutor,
        );
        resolvedSupplierId = sysSupplier.id;
        supplierName = sysSupplier.name;
        supplierGstin = sysSupplier.gstin || null;
      } else if (resolvedSupplierId) {
        const supplier = tx
          .select()
          .from(suppliers)
          .where(eq(suppliers.id, resolvedSupplierId))
          .get();
        if (!supplier) throw new Error('Invalid supplier ID');
        supplierName = supplier.name;
        supplierGstin = supplier.gstin;
      }

      const id = randomUUID();
      const now = new Date();

      const headerPayload = {
        ...parsedPayload,
        supplierId: resolvedSupplierId as string,
        supplierName,
        supplierGstin,
        id,
        companyId,
        purchaseNumber,
        status: 'DRAFT' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        syncVersion: 1,
      };

      // Process Lines and Fetch Snapshots
      const linesPayload = [];
      for (const line of parsedPayload.lines) {
        let itemName: string | undefined = undefined;
        let itemCode: string | null | undefined = undefined;
        let unitShortName: string | undefined = undefined;
        let hsnCode: string | null | undefined = undefined;
        let expenseLedgerId: string | null | undefined = undefined;

        if (docType === 'PURCHASE') {
          if (!line.productId) throw new Error('PURCHASE line requires a productId');
          const item = tx.select().from(products).where(eq(products.id, line.productId)).get();
          if (!item) throw new Error(`Invalid item ID: ${line.productId}`);
          itemName = item.name;
          itemCode = item.sku;
          hsnCode = item.hsnCode;
        } else {
          if (line.productId) throw new Error('EXPENSE line cannot have a productId');
          if (!line.expensePresetId) throw new Error('EXPENSE line requires an expensePresetId');
          const preset = tx
            .select()
            .from(expense_presets)
            .where(
              and(
                eq(expense_presets.id, line.expensePresetId),
                eq(expense_presets.companyId, companyId),
              ),
            )
            .get();
          if (!preset) throw new Error(`Invalid expense preset ID: ${line.expensePresetId}`);
          expenseLedgerId = preset.ledgerId;
          itemName = preset.name;
        }

        let taxPercentage: number | undefined = undefined;
        if (line.taxId) {
          const tax = tx.select().from(taxes).where(eq(taxes.id, line.taxId)).get();
          if (!tax) throw new Error(`Invalid tax ID: ${line.taxId}`);
          taxPercentage = tax.rate;
        }

        if (line.unitId) {
          const unit = tx.select().from(units).where(eq(units.id, line.unitId)).get();
          if (!unit) throw new Error(`Invalid unit ID: ${line.unitId}`);
          unitShortName = unit.shortName;
        }

        linesPayload.push({
          ...line,
          id: randomUUID(),
          itemName: itemName!,
          itemCode,
          unitShortName: unitShortName!,
          taxPercentage: taxPercentage!,
          hsnCode,
          expenseLedgerId,
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

  public async updateDraft(payload: UpdatePurchaseInput, pin?: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');
    const parsedPayload = updatePurchaseSchema.parse(payload);

    const existingBeforeTx = await this.purchaseRepo.getById(parsedPayload.id, companyId);
    if (!existingBeforeTx) throw new Error('Purchase Invoice not found');
    if (existingBeforeTx.status === 'CANCELLED')
      throw new Error('Cannot update a cancelled invoice.');

    if (existingBeforeTx.status === 'SUBMITTED') {
      if (!pin) throw new Error('PIN is required to edit a submitted invoice.');
      const isValid = await authService.verifyActionPin(pin);
      if (!isValid) throw new Error('Invalid PIN provided.');
    }

    if (parsedPayload.status && parsedPayload.status !== existingBeforeTx.status) {
      if (!(existingBeforeTx.status === 'SUBMITTED' && parsedPayload.status === 'DRAFT' && pin)) {
        throw new Error('Cannot change status during update. Use submit or cancel actions.');
      }
    }

    return this.purchaseRepo.transaction((tx) => {
      const existing = this.purchaseRepo.getByIdSync(parsedPayload.id, companyId, tx);
      if (!existing) throw new Error('Purchase Invoice not found');
      if (existing.status === 'CANCELLED') throw new Error('Cannot update a cancelled invoice.');

      if (['SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(existing.status)) {
        inventoryEngine.reversePurchaseInvoiceSync(existing.id, tx);
        journalService.reversePurchaseBillSync(existing.id, tx);
      }

      const { id, lines, isMiscellaneous, ...restHeaderUpdates } = parsedPayload;
      const headerUpdates: Record<string, unknown> = { ...restHeaderUpdates };

      if (existing.documentType === 'EXPENSE' && isMiscellaneous) {
        const sysSupplier = systemSupplierSeeder.getOrCreateMiscellaneousSupplierSync(
          companyId,
          tx as import('../repositories/BaseRepository').TransactionExecutor,
        );
        headerUpdates.supplierId = sysSupplier.id;
        headerUpdates.supplierName = sysSupplier.name;
        headerUpdates.supplierGstin = sysSupplier.gstin || null;
      } else if (headerUpdates.supplierId && headerUpdates.supplierId !== existing.supplierId) {
        const supplier = tx
          .select()
          .from(suppliers)
          .where(eq(suppliers.id, headerUpdates.supplierId as string))
          .get();
        if (supplier) {
          headerUpdates.supplierName = supplier.name;
          headerUpdates.supplierGstin = supplier.gstin;
        }
      }

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
            existing.documentType === 'PURCHASE' &&
            (!existingLine ||
              (line.productId !== undefined && line.productId !== existingLine.productId));

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

          let expenseLedgerId: string | undefined = undefined;
          const isNewPreset =
            existing.documentType === 'EXPENSE' &&
            (!existingLine ||
              (line.expensePresetId !== undefined &&
                line.expensePresetId !== existingLine.expensePresetId));

          if (isNewPreset) {
            const pId = line.expensePresetId || existingLine?.expensePresetId;
            if (pId) {
              const preset = tx
                .select()
                .from(expense_presets)
                .where(and(eq(expense_presets.id, pId), eq(expense_presets.companyId, companyId)))
                .get();
              if (preset) {
                itemName = preset.name;
                expenseLedgerId = preset.ledgerId;
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
          if (expenseLedgerId !== undefined) processedLine.expenseLedgerId = expenseLedgerId;

          processedLines.push(processedLine as Partial<PurchaseDto['lines'][0]>);
        }
      }

      this.purchaseRepo.updateSync(id, companyId, headerUpdates, processedLines, tx);

      if (existing.status === 'SUBMITTED') {
        this.submitPurchaseInnerSync(
          id,
          companyId,
          tx as import('../repositories/BaseRepository').TransactionExecutor,
        );
      }
    });
  }

  public async submitPurchase(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    return this.purchaseRepo.transaction((tx) => {
      this.submitPurchaseInnerSync(
        id,
        companyId,
        tx as import('../repositories/BaseRepository').TransactionExecutor,
      );
    });
  }

  private submitPurchaseInnerSync(
    id: string,
    companyId: string,
    tx: import('../repositories/BaseRepository').TransactionExecutor,
  ): void {
    const invoice = this.purchaseRepo.getByIdSync(id, companyId, tx);
    if (!invoice) throw new Error(`Purchase Invoice not found: ${id}`);

    // Allow re-submission during an edit (status is still SUBMITTED before update logic changes it internally)
    // Actually, in updateDraft we didn't change the status back to DRAFT internally, it's still SUBMITTED.
    // So we shouldn't throw if status === 'SUBMITTED' when called from updateDraft.
    if (invoice.status === 'CANCELLED') throw new Error('Cannot submit a cancelled invoice');
    if (invoice.status !== 'DRAFT' && invoice.status !== 'SUBMITTED')
      throw new Error(`Invalid status for submission: ${invoice.status}`);

    if (!invoice.lines || invoice.lines.length === 0) {
      throw new Error('Cannot submit invoice without items');
    }

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalInventoryAmount = 0;
    let totalExpenseAmount = 0;
    let fallbackTotalTax = 0;

    const expenseLines: { expenseLedgerId: string; amount: number }[] = [];

    for (const line of invoice.lines) {
      if (invoice.documentType === 'PURCHASE') {
        if (!line.productId) throw new Error(`Product missing on PURCHASE line ${line.id}`);
        const product = this.productRepo.getByIdSync(line.productId, companyId, tx);
        if (!product) throw new Error(`Product not found for item: ${line.productId}`);

        if (product.itemType !== 'SERVICE' && product.itemType !== 'NON_INVENTORY_ITEM') {
          totalInventoryAmount += line.taxableAmount;
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
        } else {
          totalExpenseAmount += line.taxableAmount;
        }
      } else {
        // EXPENSE
        if (!line.expenseLedgerId) throw new Error(`Ledger missing on EXPENSE line ${line.id}`);
        expenseLines.push({
          expenseLedgerId: line.expenseLedgerId,
          amount: line.taxableAmount,
        });
      }

      totalCgst += line.cgstAmount || 0;
      totalSgst += line.sgstAmount || 0;
      totalIgst += line.igstAmount || 0;

      fallbackTotalTax += line.taxAmount || 0;
    }

    if (totalCgst === 0 && totalSgst === 0 && totalIgst === 0 && fallbackTotalTax > 0) {
      totalIgst = fallbackTotalTax;
    }

    if (invoice.documentType === 'EXPENSE') {
      journalService.postExpenseBillSync(
        {
          companyId,
          financialYearId: invoice.financialYearId,
          invoiceId: id,
          invoiceDate: invoice.purchaseDate,
          supplierId: invoice.supplierId,
          paymentAccountId: invoice.paymentAccountId,
          lines: expenseLines,
          totalCgst,
          totalSgst,
          totalIgst,
          totalInvoiceAmount: invoice.grandTotal,
          roundOffAmount: invoice.roundOffAmount || 0,
        },
        tx,
      );
    } else {
      if (!invoice.supplierId) throw new Error('PURCHASE document requires supplierId');
      journalService.postPurchaseBillSync(
        {
          companyId,
          financialYearId: invoice.financialYearId,
          invoiceId: id,
          invoiceDate: invoice.purchaseDate,
          supplierId: invoice.supplierId,
          totalInventoryAmount,
          totalExpenseAmount,
          totalCgst,
          totalSgst,
          totalIgst,
          totalInvoiceAmount: invoice.grandTotal,
          roundOffAmount: invoice.roundOffAmount || 0,
        },
        tx,
      );
    }

    this.purchaseRepo.updateStatusSync(id, companyId, 'SUBMITTED', tx);
  }

  public async cancelPurchase(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    await this.purchaseRepo.transaction((tx) => {
      const existing = this.purchaseRepo.getByIdSync(id, companyId, tx);
      if (!existing) throw new Error('Purchase Invoice not found');
      if (existing.status === 'CANCELLED') throw new Error('Purchase Invoice already cancelled');

      if (['SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(existing.status)) {
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

  public async recordPayment(
    invoiceId: string,
    payload: RecordPaymentInput,
  ): Promise<{ settlementId: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const invoice = await this.purchaseRepo.getById(invoiceId, companyId);
    if (!invoice) throw new Error(`Purchase Invoice not found: ${invoiceId}`);

    if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
      throw new Error(`Cannot record payment for invoice in ${invoice.status} status.`);
    }

    if (!invoice.supplierId) {
      throw new Error('Supplier missing on purchase invoice. Cannot record payment.');
    }

    // Delegate to settlement service which handles everything in one transaction
    return settlementService.createSettlement({
      settlementDate: payload.paymentDate,
      partyType: 'SUPPLIER',
      partyId: invoice.supplierId,
      amount: payload.amount,
      paymentMode: payload.paymentMode,
      paymentAccountId: payload.paymentAccountId,
      referenceNumber: payload.referenceNumber,
      referenceDate: payload.referenceDate,
      notes: payload.notes,
      allocations: [
        {
          documentType: 'PURCHASE_BILL',
          documentId: invoiceId,
          allocatedAmount: payload.amount,
        },
      ],
    });
  }
}

export const purchaseService = new PurchaseService();
