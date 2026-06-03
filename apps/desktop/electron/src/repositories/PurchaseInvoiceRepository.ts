import { randomUUID } from 'crypto';

import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import {
  CreatePurchaseInvoiceInput,
  ListPurchaseInvoicesOptions,
  PurchaseInvoiceDto,
  PurchaseInvoiceLineDto,
} from '@vyora/types';
import { and, desc, eq } from 'drizzle-orm';

type DbPurchaseInvoice = typeof purchase_invoices.$inferSelect;
type DbPurchaseInvoiceItem = typeof purchase_invoice_items.$inferSelect;

function mapToLineDto(entity: DbPurchaseInvoiceItem): PurchaseInvoiceLineDto {
  return {
    id: entity.id,
    purchaseInvoiceId: entity.purchaseInvoiceId,
    productId: entity.productId,
    unitId: entity.unitId,
    taxId: entity.taxId,
    description: entity.description,
    hsnCode: entity.hsnCode,
    quantity: entity.quantity,
    rate: entity.rate,
    discountAmount: entity.discountAmount,
    taxableAmount: entity.taxableAmount,
    taxAmount: entity.taxAmount,
    lineTotal: entity.lineTotal,
  };
}

function mapToDto(entity: DbPurchaseInvoice, items?: DbPurchaseInvoiceItem[]): PurchaseInvoiceDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    financialYearId: entity.financialYearId,
    supplierId: entity.supplierId,
    invoiceNumber: entity.invoiceNumber,
    supplierInvoiceNumber: entity.supplierInvoiceNumber,
    invoiceDate: entity.invoiceDate,
    subtotal: entity.subtotal,
    discountAmount: entity.discountAmount,
    taxAmount: entity.taxAmount,
    roundOffAmount: entity.roundOffAmount,
    grandTotal: entity.grandTotal,
    notes: entity.notes,
    status: entity.status,
    createdAt: entity.createdAt,
    items: items ? items.map(mapToLineDto) : undefined,
  };
}

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

export class PurchaseInvoiceRepository extends BaseRepository {
  public async createInvoice(
    data: CreatePurchaseInvoiceInput,
    tx?: DbTransaction,
  ): Promise<{ invoiceId: string }> {
    const executeLogic = async (executor: TransactionExecutor) => {
      const invoiceId = randomUUID();
      const now = new Date();

      const { items, ...invoiceData } = data;

      await executor.insert(purchase_invoices).values({
        ...invoiceData,
        id: invoiceId,
        createdAt: now,
      });

      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          id: randomUUID(),
          purchaseInvoiceId: invoiceId,
        }));

        await executor.insert(purchase_invoice_items).values(itemsToInsert);
      }

      return { invoiceId };
    };

    if (tx) {
      return await executeLogic(tx);
    } else {
      return await this.db.transaction(async (innerTx) => {
        return await executeLogic(innerTx);
      });
    }
  }

  public async getById(id: string): Promise<PurchaseInvoiceDto | null> {
    const invoice = await this.db
      .select()
      .from(purchase_invoices)
      .where(eq(purchase_invoices.id, id))
      .get();

    if (!invoice) return null;

    const items = await this.db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, id))
      .all();

    return mapToDto(invoice, items);
  }

  public async getByInvoiceNumber(
    companyId: string,
    financialYearId: string,
    invoiceNumber: string,
  ): Promise<PurchaseInvoiceDto | null> {
    const invoice = await this.db
      .select()
      .from(purchase_invoices)
      .where(
        and(
          eq(purchase_invoices.companyId, companyId),
          eq(purchase_invoices.financialYearId, financialYearId),
          eq(purchase_invoices.invoiceNumber, invoiceNumber),
        ),
      )
      .get();

    if (!invoice) return null;

    const items = await this.db
      .select()
      .from(purchase_invoice_items)
      .where(eq(purchase_invoice_items.purchaseInvoiceId, invoice.id))
      .all();

    return mapToDto(invoice, items);
  }

  public async list(options?: ListPurchaseInvoicesOptions): Promise<PurchaseInvoiceDto[]> {
    let query = this.db.select().from(purchase_invoices).$dynamic();

    const conditions = [];
    if (options?.companyId) {
      conditions.push(eq(purchase_invoices.companyId, options.companyId));
    }
    if (options?.financialYearId) {
      conditions.push(eq(purchase_invoices.financialYearId, options.financialYearId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(purchase_invoices.invoiceDate));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    const results = await query.all();
    return results.map((row) => mapToDto(row));
  }
}
