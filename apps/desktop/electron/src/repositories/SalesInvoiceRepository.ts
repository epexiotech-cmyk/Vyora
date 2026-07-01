import { randomUUID } from 'crypto';

import { sales_invoices, sales_invoice_items } from '@vyora/database';
import {
  CreateSalesInvoiceInput,
  SalesInvoiceDto,
  SalesInvoiceLineDto,
  ListSalesInvoicesOptions,
  UpdateSalesInvoiceInput,
  InvoiceStatus,
} from '@vyora/types';
import { eq, and, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

type DbSalesInvoice = typeof sales_invoices.$inferSelect;
type DbSalesInvoiceItem = typeof sales_invoice_items.$inferSelect;

function mapToLineDto(entity: DbSalesInvoiceItem): SalesInvoiceLineDto {
  return {
    id: entity.id,
    salesInvoiceId: entity.salesInvoiceId,
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

function mapToDto(entity: DbSalesInvoice, items?: DbSalesInvoiceItem[]): SalesInvoiceDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    financialYearId: entity.financialYearId,
    customerId: entity.customerId,
    invoiceNumber: entity.invoiceNumber,
    invoiceDate: entity.invoiceDate,
    subtotal: entity.subtotal,
    discountAmount: entity.discountAmount,
    taxAmount: entity.taxAmount,
    roundOffAmount: entity.roundOffAmount,
    grandTotal: entity.grandTotal,
    notes: entity.notes,
    status: entity.status as InvoiceStatus,
    createdAt: entity.createdAt,
    items: items ? items.map(mapToLineDto) : undefined,
  };
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
        status: invoiceData.status || 'DRAFT',
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
  public async getById(id: string): Promise<SalesInvoiceDto | null> {
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

    return mapToDto(invoice, items);
  }

  public async getByInvoiceNumber(
    companyId: string,
    financialYearId: string,
    invoiceNumber: string,
  ): Promise<SalesInvoiceDto | null> {
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

    return mapToDto(invoice, items);
  }

  public async list(options?: ListSalesInvoicesOptions): Promise<SalesInvoiceDto[]> {
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

    const results = await query.all();
    return results.map((row) => mapToDto(row));
  }

  public async updateInvoice(
    invoiceId: string,
    data: UpdateSalesInvoiceInput,
    tx?: DbTransaction,
  ): Promise<void> {
    const executeLogic = async (executor: TransactionExecutor) => {
      const { items, ...invoiceData } = data;

      // Update header
      if (Object.keys(invoiceData).length > 0) {
        await executor
          .update(sales_invoices)
          .set(invoiceData)
          .where(eq(sales_invoices.id, invoiceId));
      }

      // Update lines (replace all)
      if (items !== undefined) {
        await executor
          .delete(sales_invoice_items)
          .where(eq(sales_invoice_items.salesInvoiceId, invoiceId));

        if (items.length > 0) {
          const itemsToInsert = items.map((item) => ({
            ...item,
            id: randomUUID(),
            salesInvoiceId: invoiceId,
          }));
          await executor.insert(sales_invoice_items).values(itemsToInsert);
        }
      }
    };

    if (tx) {
      await executeLogic(tx);
    } else {
      await this.db.transaction(async (innerTx) => {
        await executeLogic(innerTx);
      });
    }
  }

  public async updateStatus(
    invoiceId: string,
    status: InvoiceStatus,
    tx?: DbTransaction,
  ): Promise<void> {
    const executor = tx || this.db;
    await executor.update(sales_invoices).set({ status }).where(eq(sales_invoices.id, invoiceId));
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  public createInvoiceSync(
    data: CreateSalesInvoiceInput,
    tx: TransactionExecutor,
  ): { invoiceId: string } {
    const invoiceId = randomUUID();
    const now = new Date();

    const { items, ...invoiceData } = data;

    tx.insert(sales_invoices)
      .values({
        ...invoiceData,
        id: invoiceId,
        status: invoiceData.status || 'DRAFT',
        createdAt: now,
      })
      .run();

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        ...item,
        id: randomUUID(),
        salesInvoiceId: invoiceId,
      }));

      tx.insert(sales_invoice_items).values(itemsToInsert).run();
    }

    return { invoiceId };
  }

  public getByIdSync(id: string, tx: TransactionExecutor): SalesInvoiceDto | null {
    const invoice = tx.select().from(sales_invoices).where(eq(sales_invoices.id, id)).get();

    if (!invoice) return null;

    const items = tx
      .select()
      .from(sales_invoice_items)
      .where(eq(sales_invoice_items.salesInvoiceId, id))
      .all();

    return mapToDto(invoice, items);
  }

  public updateInvoiceSync(
    invoiceId: string,
    data: UpdateSalesInvoiceInput,
    tx: TransactionExecutor,
  ): void {
    const { items, ...invoiceData } = data;

    // Update header
    if (Object.keys(invoiceData).length > 0) {
      tx.update(sales_invoices).set(invoiceData).where(eq(sales_invoices.id, invoiceId)).run();
    }

    // Update lines (replace all)
    if (items !== undefined) {
      tx.delete(sales_invoice_items).where(eq(sales_invoice_items.salesInvoiceId, invoiceId)).run();

      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          ...item,
          id: randomUUID(),
          salesInvoiceId: invoiceId,
        }));
        tx.insert(sales_invoice_items).values(itemsToInsert).run();
      }
    }
  }

  public updateStatusSync(invoiceId: string, status: InvoiceStatus, tx: TransactionExecutor): void {
    tx.update(sales_invoices).set({ status }).where(eq(sales_invoices.id, invoiceId)).run();
  }
}
