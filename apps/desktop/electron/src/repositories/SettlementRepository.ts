import {
  settlements,
  settlement_allocations,
  customers,
  suppliers,
  payment_accounts,
  sales_invoices,
  purchase_invoices,
} from '@vyora/database';
import {
  InsertSettlement,
  InsertSettlementAllocation,
  Settlement,
  SettlementAllocation,
} from '@vyora/database';
import { ListSettlementsOptions } from '@vyora/types';
import { eq, and, desc, sql } from 'drizzle-orm';

import { BaseRepository, TransactionExecutor } from './BaseRepository';

export class SettlementRepository extends BaseRepository {
  public createSettlementSync(
    payload: InsertSettlement,
    allocations: InsertSettlementAllocation[],
    tx: TransactionExecutor,
  ): string {
    tx.insert(settlements).values(payload).run();

    if (allocations.length > 0) {
      tx.insert(settlement_allocations).values(allocations).run();
    }

    return payload.id;
  }

  public getSettlementById(
    id: string,
    companyId: string,
    tx?: TransactionExecutor,
  ): Settlement | undefined {
    const executor = tx || this.db;
    return executor
      .select()
      .from(settlements)
      .where(and(eq(settlements.id, id), eq(settlements.companyId, companyId)))
      .get();
  }

  public getSettlementAllocationsSync(
    settlementId: string,
    companyId: string,
    tx: TransactionExecutor,
  ): SettlementAllocation[] {
    return tx
      .select()
      .from(settlement_allocations)
      .where(
        and(
          eq(settlement_allocations.settlementId, settlementId),
          eq(settlement_allocations.companyId, companyId),
        ),
      )
      .all();
  }

  public getInvoiceAllocationsSync(
    documentType: string,
    documentId: string,
    companyId: string,
    tx: TransactionExecutor,
  ): SettlementAllocation[] {
    return tx
      .select()
      .from(settlement_allocations)
      .where(
        and(
          eq(
            settlement_allocations.documentType,
            documentType as
              | 'SALES_INVOICE'
              | 'PURCHASE_BILL'
              | 'CREDIT_NOTE'
              | 'DEBIT_NOTE'
              | 'OPENING_BALANCE',
          ),
          eq(settlement_allocations.documentId, documentId),
          eq(settlement_allocations.companyId, companyId),
        ),
      )
      .all();
  }

  public listSettlements(options: ListSettlementsOptions) {
    const { type, companyId, financialYearId, limit = 50, offset = 0 } = options;
    const conditions = [eq(settlements.settlementType, type), eq(settlements.isActive, true)];

    if (companyId) conditions.push(eq(settlements.companyId, companyId));
    if (financialYearId) conditions.push(eq(settlements.financialYearId, financialYearId));

    const whereClause = and(...conditions);

    const baseQuery = this.db
      .select({
        id: settlements.id,
        companyId: settlements.companyId,
        branchId: settlements.branchId,
        financialYearId: settlements.financialYearId,
        settlementType: settlements.settlementType,
        partyType: settlements.partyType,
        partyId: settlements.partyId,
        settlementNumber: settlements.settlementNumber,
        settlementDate: settlements.settlementDate,
        amount: settlements.amount,
        allocatedAmount: settlements.allocatedAmount,
        unallocatedAmount: settlements.unallocatedAmount,
        paymentMode: settlements.paymentMode,
        bankLedgerId: settlements.bankLedgerId,
        referenceNumber: settlements.referenceNumber,
        referenceDate: settlements.referenceDate,
        notes: settlements.notes,
        status: settlements.status,
        isFrozen: settlements.isFrozen,
        syncVersion: settlements.syncVersion,
        isActive: settlements.isActive,
        createdAt: settlements.createdAt,
        updatedAt: settlements.updatedAt,
        deletedAt: settlements.deletedAt,
        customerName: customers.name,
        supplierName: suppliers.name,
        paymentAccountName: payment_accounts.displayName,
      })
      .from(settlements)
      .leftJoin(customers, eq(settlements.partyId, customers.id))
      .leftJoin(suppliers, eq(settlements.partyId, suppliers.id))
      .leftJoin(payment_accounts, eq(settlements.bankLedgerId, payment_accounts.ledgerId))
      .where(whereClause);

    const data = baseQuery
      .orderBy(desc(settlements.settlementDate), desc(settlements.createdAt))
      .limit(limit)
      .offset(offset)
      .all()
      .map((row) => ({
        ...row,
        partyName: row.customerName || row.supplierName || 'Unknown Party',
        paymentAccountName: row.paymentAccountName || 'Unknown Account',
      }));

    const totalCountQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(settlements)
      .where(whereClause)
      .get();

    const total = totalCountQuery?.count || 0;

    return { data, total, limit, offset };
  }

  public getSettlementDtoById(id: string, companyId: string) {
    const row = this.db
      .select({
        id: settlements.id,
        companyId: settlements.companyId,
        branchId: settlements.branchId,
        financialYearId: settlements.financialYearId,
        settlementType: settlements.settlementType,
        partyType: settlements.partyType,
        partyId: settlements.partyId,
        settlementNumber: settlements.settlementNumber,
        settlementDate: settlements.settlementDate,
        amount: settlements.amount,
        allocatedAmount: settlements.allocatedAmount,
        unallocatedAmount: settlements.unallocatedAmount,
        paymentMode: settlements.paymentMode,
        bankLedgerId: settlements.bankLedgerId,
        referenceNumber: settlements.referenceNumber,
        referenceDate: settlements.referenceDate,
        notes: settlements.notes,
        status: settlements.status,
        isFrozen: settlements.isFrozen,
        syncVersion: settlements.syncVersion,
        isActive: settlements.isActive,
        createdAt: settlements.createdAt,
        updatedAt: settlements.updatedAt,
        deletedAt: settlements.deletedAt,
        customerName: customers.name,
        supplierName: suppliers.name,
        paymentAccountName: payment_accounts.displayName,
      })
      .from(settlements)
      .leftJoin(customers, eq(settlements.partyId, customers.id))
      .leftJoin(suppliers, eq(settlements.partyId, suppliers.id))
      .leftJoin(payment_accounts, eq(settlements.bankLedgerId, payment_accounts.ledgerId))
      .where(and(eq(settlements.id, id), eq(settlements.companyId, companyId)))
      .get();

    if (!row) return undefined;

    const allocationsRaw = this.getSettlementAllocationsSync(id, companyId, this.db);

    // Enrich allocations with document details
    const allocations = allocationsRaw.map((alloc) => {
      let documentNumber = '';
      let documentDate = new Date();
      let documentTotal = 0;
      let amountPaid = 0;

      if (alloc.documentType === 'SALES_INVOICE') {
        const invoice = this.db
          .select()
          .from(sales_invoices)
          .where(
            and(eq(sales_invoices.id, alloc.documentId), eq(sales_invoices.companyId, companyId)),
          )
          .get();
        if (invoice) {
          documentNumber = invoice.invoiceNumber;
          documentDate = invoice.invoiceDate;
          documentTotal = invoice.grandTotal;
        }
      } else if (alloc.documentType === 'PURCHASE_BILL') {
        const invoice = this.db
          .select()
          .from(purchase_invoices)
          .where(
            and(
              eq(purchase_invoices.id, alloc.documentId),
              eq(purchase_invoices.companyId, companyId),
            ),
          )
          .get();
        if (invoice) {
          documentNumber = invoice.purchaseNumber;
          documentDate = invoice.purchaseDate;
          documentTotal = invoice.grandTotal;
        }
      }

      // Calculate amount paid so far for this invoice from COMPLETED settlements
      const allInvoiceAllocations = this.getInvoiceAllocationsSync(
        alloc.documentType,
        alloc.documentId,
        companyId,
        this.db,
      );
      for (const invAlloc of allInvoiceAllocations) {
        const s = this.db
          .select()
          .from(settlements)
          .where(eq(settlements.id, invAlloc.settlementId))
          .get();
        if (s && s.status === 'COMPLETED' && s.isActive) {
          amountPaid += invAlloc.allocatedAmount;
        }
      }

      // The current remaining balance
      const currentBalanceDue = documentTotal - amountPaid;

      // The balance before this specific allocation
      // If this settlement is completed and active, its allocation is already inside amountPaid.
      // So balance before = current balance + this allocation.
      // If this settlement is NOT completed, its allocation is not in amountPaid.
      // So balance before = current balance.
      let documentBalance = currentBalanceDue;
      if (row.status === 'COMPLETED' && row.isActive) {
        documentBalance = currentBalanceDue + alloc.allocatedAmount;
      }

      return {
        ...alloc,
        documentNumber,
        documentDate,
        documentTotal,
        documentBalance,
      };
    });

    return {
      ...row,
      partyName: row.customerName || row.supplierName || 'Unknown Party',
      paymentAccountName: row.paymentAccountName || 'Unknown Account',
      allocations,
    };
  }
}

export const settlementRepository = new SettlementRepository();
