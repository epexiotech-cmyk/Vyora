import { randomUUID } from 'crypto';

import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import { PurchaseDto, SearchPurchasesOptions, PurchaseListDto, InvoiceStatus } from '@vyora/types';
import { eq, and, like, desc, isNull, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

export class PurchaseRepository extends BaseRepository {
  public async create(
    companyId: string,
    payload: Omit<PurchaseDto, 'lines'>,
    lines: Omit<PurchaseDto['lines'][0], 'purchaseInvoiceId'>[],
    tx?: DbTransaction,
  ): Promise<string> {
    const executor = tx ?? this.db;
    // Insert Header
    await executor.insert(purchase_invoices).values(payload);

    // Insert Lines
    if (lines.length > 0) {
      const linesWithHeaderId = lines.map((line) => ({
        ...line,
        purchaseInvoiceId: payload.id,
      }));
      await executor.insert(purchase_invoice_items).values(linesWithHeaderId);
    }

    return payload.id;
  }

  public async update(
    id: string,
    companyId: string,
    headerPayload: Partial<Omit<PurchaseDto, 'lines' | 'id' | 'companyId'>>,
    lines?: Partial<PurchaseDto['lines'][0]>[],
    tx?: DbTransaction,
  ): Promise<void> {
    const executor = tx ?? this.db;
    // 1. Update Header
    if (Object.keys(headerPayload).length > 0) {
      await executor
        .update(purchase_invoices)
        .set({
          ...headerPayload,
          updatedAt: new Date(),
          syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
        })
        .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)));
    }

    // 2. Process Lines Diffs (Full Replacement Strategy for simplicity in standard offline-first)
    if (lines) {
      // Find existing lines
      const existingLines = await executor
        .select({ id: purchase_invoice_items.id })
        .from(purchase_invoice_items)
        .where(
          and(
            eq(purchase_invoice_items.purchaseInvoiceId, id),
            isNull(purchase_invoice_items.deletedAt),
          ),
        )
        .all();

      const existingLineIds = existingLines.map((l) => l.id);
      const incomingLineIds = lines.filter((l) => l.id).map((l) => l.id as string);

      // Lines to soft delete
      const linesToDelete = existingLineIds.filter((extId) => !incomingLineIds.includes(extId));

      if (linesToDelete.length > 0) {
        for (const lineId of linesToDelete) {
          await executor
            .update(purchase_invoice_items)
            .set({
              deletedAt: new Date(),
              syncVersion: sql`${purchase_invoice_items.syncVersion} + 1`,
            })
            .where(eq(purchase_invoice_items.id, lineId));
        }
      }

      // Process incoming lines (Update existing, Insert new)
      for (const line of lines) {
        if (line.id && existingLineIds.includes(line.id)) {
          // Update
          await executor
            .update(purchase_invoice_items)
            .set({
              ...line,
              updatedAt: new Date(),
              syncVersion: sql`${purchase_invoice_items.syncVersion} + 1`,
            })
            .where(eq(purchase_invoice_items.id, line.id));
        } else {
          // Insert new line
          const newLine = {
            ...line,
            id: randomUUID(),
            purchaseInvoiceId: id,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncVersion: 1,
            isActive: true,
          };
          await executor
            .insert(purchase_invoice_items)
            .values(newLine as typeof purchase_invoice_items.$inferInsert);
        }
      }
    }
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<PurchaseDto | null> {
    const executor = tx ?? this.db;
    const header = await executor
      .select()
      .from(purchase_invoices)
      .where(
        and(
          eq(purchase_invoices.id, id),
          eq(purchase_invoices.companyId, companyId),
          isNull(purchase_invoices.deletedAt),
        ),
      )
      .get();

    if (!header) return null;

    const lines = await executor
      .select()
      .from(purchase_invoice_items)
      .where(
        and(
          eq(purchase_invoice_items.purchaseInvoiceId, id),
          isNull(purchase_invoice_items.deletedAt),
        ),
      )
      .all();

    return {
      ...header,
      status: header.status as PurchaseDto['status'],
      lines: lines.map((line) => ({
        ...line,
      })),
    } as PurchaseDto;
  }

  public async search(
    companyId: string,
    options: SearchPurchasesOptions,
  ): Promise<PurchaseListDto> {
    const { query, supplierId, status, isActive, limit = 20, offset = 0 } = options;

    const conditions = [
      eq(purchase_invoices.companyId, companyId),
      isNull(purchase_invoices.deletedAt),
    ];

    if (supplierId) conditions.push(eq(purchase_invoices.supplierId, supplierId));
    if (status) conditions.push(eq(purchase_invoices.status, status));
    if (isActive !== undefined) conditions.push(eq(purchase_invoices.isActive, isActive));
    if (query) {
      conditions.push(like(purchase_invoices.purchaseNumber, `%${query}%`));
    }

    const whereClause = and(...conditions);

    // Get Total Count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(purchase_invoices)
      .where(whereClause)
      .get();

    const total = countResult?.count ?? 0;

    // Get Paginated Data
    const data = await this.db
      .select({
        id: purchase_invoices.id,
        purchaseNumber: purchase_invoices.purchaseNumber,
        purchaseDate: purchase_invoices.purchaseDate,
        supplierId: purchase_invoices.supplierId,
        supplierName: purchase_invoices.supplierName,
        supplierInvoiceNumber: purchase_invoices.supplierInvoiceNumber,
        grandTotal: purchase_invoices.grandTotal,
        status: purchase_invoices.status,
        isActive: purchase_invoices.isActive,
      })
      .from(purchase_invoices)
      .where(whereClause)
      .orderBy(desc(purchase_invoices.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return { data: data as PurchaseListDto['data'], total };
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx ?? this.db;
    // 1. Deactivate Header
    await executor
      .update(purchase_invoices)
      .set({
        deletedAt: new Date(),
        syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
      })
      .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)));

    // 2. Cascade Deactivate Lines
    await executor
      .update(purchase_invoice_items)
      .set({
        deletedAt: new Date(),
        syncVersion: sql`${purchase_invoice_items.syncVersion} + 1`,
      })
      .where(eq(purchase_invoice_items.purchaseInvoiceId, id));
  }
  public async updateStatus(
    id: string,
    companyId: string,
    status: InvoiceStatus,
    tx?: DbTransaction,
  ): Promise<void> {
    const executor = tx ?? this.db;
    await executor
      .update(purchase_invoices)
      .set({
        status,
        updatedAt: new Date(),
        syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
      })
      .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)));
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  public createSync(
    companyId: string,
    payload: Omit<PurchaseDto, 'lines'>,
    lines: Omit<PurchaseDto['lines'][0], 'purchaseInvoiceId'>[],
    tx: TransactionExecutor,
  ): string {
    tx.insert(purchase_invoices).values(payload).run();

    if (lines.length > 0) {
      const linesWithHeaderId = lines.map((line) => ({
        ...line,
        purchaseInvoiceId: payload.id,
      }));
      tx.insert(purchase_invoice_items).values(linesWithHeaderId).run();
    }

    return payload.id;
  }

  public updateSync(
    id: string,
    companyId: string,
    headerPayload: Partial<Omit<PurchaseDto, 'lines' | 'id' | 'companyId'>>,
    lines?: Partial<PurchaseDto['lines'][0]>[],
    tx?: TransactionExecutor,
  ): void {
    const executor = tx ?? this.db;

    if (Object.keys(headerPayload).length > 0) {
      executor
        .update(purchase_invoices)
        .set({
          ...headerPayload,
          updatedAt: new Date(),
          syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
        })
        .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)))
        .run();
    }

    if (lines) {
      const existingLines = executor
        .select({ id: purchase_invoice_items.id })
        .from(purchase_invoice_items)
        .where(
          and(
            eq(purchase_invoice_items.purchaseInvoiceId, id),
            isNull(purchase_invoice_items.deletedAt),
          ),
        )
        .all();

      const existingLineIds = existingLines.map((l: { id: string }) => l.id);
      const incomingLineIds = lines
        .filter((l: { id?: string }) => l.id)
        .map((l: { id?: string }) => l.id as string);

      const linesToDelete = existingLineIds.filter(
        (extId: string) => !incomingLineIds.includes(extId),
      );

      if (linesToDelete.length > 0) {
        for (const lineId of linesToDelete) {
          executor
            .update(purchase_invoice_items)
            .set({
              deletedAt: new Date(),
              syncVersion: sql`${purchase_invoice_items.syncVersion} + 1`,
            })
            .where(eq(purchase_invoice_items.id, lineId))
            .run();
        }
      }

      for (const line of lines) {
        if (line.id && existingLineIds.includes(line.id)) {
          executor
            .update(purchase_invoice_items)
            .set({
              ...line,
              updatedAt: new Date(),
              syncVersion: sql`${purchase_invoice_items.syncVersion} + 1`,
            })
            .where(eq(purchase_invoice_items.id, line.id))
            .run();
        } else {
          const newLine = {
            ...line,
            id: randomUUID(),
            purchaseInvoiceId: id,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncVersion: 1,
            isActive: true,
          };
          executor
            .insert(purchase_invoice_items)
            .values(newLine as typeof purchase_invoice_items.$inferInsert)
            .run();
        }
      }
    }
  }

  public getByIdSync(id: string, companyId: string, tx?: TransactionExecutor): PurchaseDto | null {
    const executor = tx ?? this.db;
    const header = executor
      .select()
      .from(purchase_invoices)
      .where(
        and(
          eq(purchase_invoices.id, id),
          eq(purchase_invoices.companyId, companyId),
          isNull(purchase_invoices.deletedAt),
        ),
      )
      .get();

    if (!header) return null;

    const lines = executor
      .select()
      .from(purchase_invoice_items)
      .where(
        and(
          eq(purchase_invoice_items.purchaseInvoiceId, id),
          isNull(purchase_invoice_items.deletedAt),
        ),
      )
      .all();

    return {
      ...header,
      status: header.status as PurchaseDto['status'],
      lines: lines.map((line) => ({
        ...line,
      })),
    } as PurchaseDto;
  }

  public updateStatusSync(
    id: string,
    companyId: string,
    status: InvoiceStatus,
    tx: TransactionExecutor,
  ): void {
    tx.update(purchase_invoices)
      .set({
        status,
        updatedAt: new Date(),
        syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
      })
      .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)))
      .run();
  }
}
