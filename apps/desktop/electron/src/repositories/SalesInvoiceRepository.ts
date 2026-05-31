import { randomUUID } from 'crypto';

import { sales_invoices, sales_invoice_items } from '@vyora/database';
import { eq, and, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

export type CreateSalesInvoiceItemInput = {
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

export type CreateSalesInvoiceInput = {
  companyId: string;
  financialYearId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  notes?: string | null;
  status: string;
  items: CreateSalesInvoiceItemInput[];
};

export interface ListSalesInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}

export class SalesInvoiceRepository extends BaseRepository {
  public async createInvoice(
    data: CreateSalesInvoiceInput,
    tx?: DbTransaction,
  ): Promise<{ invoiceId: string }> {
    const executeLogic = async (executor: TransactionExecutor) => {
      const invoiceId = randomUUID();
      const now = new Date();

      const { items, ...invoiceData } = data;

      await executor.insert(sales_invoices).values({
        ...invoiceData,
        id: invoiceId,
        createdAt: now,
      });

      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          id: randomUUID(),
          salesInvoiceId: invoiceId,
        }));

        await executor.insert(sales_invoice_items).values(itemsToInsert);
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
      .from(sales_invoices)
      .where(eq(sales_invoices.id, id))
      .get();

    if (!invoice) return null;

    const items = await this.db
      .select()
      .from(sales_invoice_items)
      .where(eq(sales_invoice_items.salesInvoiceId, id))
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
      .from(sales_invoices)
      .where(
        and(
          eq(sales_invoices.companyId, companyId),
          eq(sales_invoices.financialYearId, financialYearId),
          eq(sales_invoices.invoiceNumber, invoiceNumber),
        ),
      )
      .get();

    if (!invoice) return null;

    const items = await this.db
      .select()
      .from(sales_invoice_items)
      .where(eq(sales_invoice_items.salesInvoiceId, invoice.id))
      .all();

    return { ...invoice, items };
  }

  public async list(options?: ListSalesInvoicesOptions) {
    let query = this.db.select().from(sales_invoices).$dynamic();

    const conditions = [];
    if (options?.companyId) {
      conditions.push(eq(sales_invoices.companyId, options.companyId));
    }
    if (options?.financialYearId) {
      conditions.push(eq(sales_invoices.financialYearId, options.financialYearId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(sales_invoices.invoiceDate));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    return await query.all();
  }
}
