import { randomUUID } from 'crypto';

import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import { eq, and, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

export type CreatePurchaseInvoiceItemInput = {
  productId: string;
  unitId: string;
  taxId: string;
  description?: string | null;
  hsnCode?: string | null;
  quantity: number;
  rate: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
};

export type CreatePurchaseInvoiceInput = {
  companyId: string;
  financialYearId: string;
  supplierId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string | null;
  invoiceDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  notes?: string | null;
  status: string;
  items: CreatePurchaseInvoiceItemInput[];
};

export interface ListPurchaseInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}

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

  public async getById(id: string) {
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

    return { ...invoice, items };
  }

  public async getByInvoiceNumber(
    companyId: string,
    financialYearId: string,
    invoiceNumber: string,
  ) {
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

    return { ...invoice, items };
  }

  public async list(options?: ListPurchaseInvoicesOptions) {
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

    return await query.all();
  }
}
