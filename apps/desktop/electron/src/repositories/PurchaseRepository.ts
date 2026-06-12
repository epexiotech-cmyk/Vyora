import { randomUUID } from 'crypto';

import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import { PurchaseDto, SearchPurchasesOptions, PurchaseListDto } from '@vyora/types';
import { eq, and, like, desc, isNull, sql } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

export class PurchaseRepository extends BaseRepository {
  public async create(
    companyId: string,
    payload: Omit<PurchaseDto, 'lines'>,
    lines: Omit<PurchaseDto['lines'][0], 'purchaseInvoiceId'>[],
  ): Promise<string> {
    return this.transaction(async (tx) => {
      // Insert Header
      await tx.insert(purchase_invoices).values(payload);

      // Insert Lines
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map((line) => ({
          ...line,
          purchaseInvoiceId: payload.id,
        }));
        await tx.insert(purchase_invoice_items).values(linesWithHeaderId);
      }

      return payload.id;
    });
  }

  public async update(
    id: string,
    companyId: string,
    headerPayload: Partial<Omit<PurchaseDto, 'lines' | 'id' | 'companyId'>>,
    lines?: Partial<PurchaseDto['lines'][0]>[],
  ): Promise<void> {
    return this.transaction(async (tx) => {
      // 1. Update Header
      if (Object.keys(headerPayload).length > 0) {
        await tx
          .update(purchase_invoices)
          .set({
            ...headerPayload,
            updatedAt: new Date(),
            syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
          })
          .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)));
      }

      // 2. Process Lines Diffs (Full Replacement Strategy for simplicity in standard offline-first)
      // Standard practice: Delete existing active lines and re-insert new ones to avoid complex diffing logic
      // Alternatively, we could do soft-deletes on lines, but for simplicity we will soft-delete omitted lines if explicitly needed.
      // Since it's a bulk operation, we'll implement full sync based on IDs provided.
      if (lines) {
        // Find existing lines
        const existingLines = await tx
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
            await tx
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
            await tx
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
            await tx
              .insert(purchase_invoice_items)
              .values(newLine as typeof purchase_invoice_items.$inferInsert);
          }
        }
      }
    });
  }

  public async getById(id: string, companyId: string): Promise<PurchaseDto | null> {
    return this.transaction(async (tx) => {
      const header = await tx
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

      const lines = await tx
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
    });
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

  public async deactivate(id: string, companyId: string): Promise<void> {
    await this.db
      .update(purchase_invoices)
      .set({
        deletedAt: new Date(),
        syncVersion: sql`${purchase_invoices.syncVersion} + 1`,
      })
      .where(and(eq(purchase_invoices.id, id), eq(purchase_invoices.companyId, companyId)));
  }
}
