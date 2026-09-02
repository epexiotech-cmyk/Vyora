import {
  vouchers,
  voucher_entries,
  InsertVoucher,
  InsertVoucherEntry,
  Voucher,
  ledgers,
  ledger_groups,
} from '@vyora/database';
import {
  VoucherListItemDto,
  VoucherFilterDto,
  VoucherDetailDto,
  TrialBalanceRowDto,
  LedgerStatementRowDto,
  JournalQueryFilter,
} from '@vyora/types';
import { eq, and, gte, lte, desc, asc, sql, ilike, sum } from 'drizzle-orm';

import { BaseRepository, TransactionExecutor } from './BaseRepository';

export class JournalRepository extends BaseRepository {
  /**
   * Creates a new voucher along with its ledger entries.
   * MUST be executed within a transaction.
   */
  public createVoucher(
    voucher: InsertVoucher,
    entries: InsertVoucherEntry[],
    tx: TransactionExecutor,
  ): Voucher {
    // 1. Insert the voucher header
    const createdVoucher = tx.insert(vouchers).values(voucher).returning().get();

    // 2. Map the voucherId to the entries
    const entriesToInsert = entries.map((entry) => ({
      ...entry,
      voucherId: createdVoucher.id,
    }));

    // 3. Insert the voucher entries
    tx.insert(voucher_entries).values(entriesToInsert).run();

    return createdVoucher;
  }

  /**
   * Voids the original voucher.
   */
  public cancelVoucher(originalVoucherId: string, tx: TransactionExecutor): void {
    const originalVouchers = tx
      .select()
      .from(vouchers)
      .where(eq(vouchers.id, originalVoucherId))
      .all();
    if (!originalVouchers.length) {
      throw new Error(`Cannot cancel voucher: Voucher ID ${originalVoucherId} not found`);
    }

    // Mark original as cancelled
    tx.update(vouchers)
      .set({ isCancelled: true, updatedAt: new Date() })
      .where(eq(vouchers.id, originalVoucherId))
      .run();
  }

  public getVoucherById(voucherId: string): VoucherDetailDto {
    const voucher = this.db.select().from(vouchers).where(eq(vouchers.id, voucherId)).get();
    if (!voucher) throw new Error(`Voucher not found: ${voucherId}`);

    const entries = this.db
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, voucherId))
      .all();

    const ledgerIds = [...new Set(entries.map((e) => e.ledgerId))];
    const ledgerNames: Record<string, string> = {};
    if (ledgerIds.length > 0) {
      const ledgerRecords = this.db
        .select({ id: ledgers.id, name: ledgers.name })
        .from(ledgers)
        .where(sql`id IN ${ledgerIds}`)
        .all();
      for (const l of ledgerRecords) {
        ledgerNames[l.id] = l.name;
      }
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const entry of entries) {
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;
    }

    return {
      ...voucher,
      entries,
      ledgerNames,
      totalDebit,
      totalCredit,
    };
  }

  public async listVouchers(
    companyId: string,
    financialYearId: string,
    filter: VoucherFilterDto,
  ): Promise<VoucherListItemDto[]> {
    let conditions = and(
      eq(vouchers.companyId, companyId),
      eq(vouchers.financialYearId, financialYearId),
    );

    if (filter.fromDate)
      conditions = and(conditions, gte(vouchers.voucherDate, new Date(filter.fromDate)));
    if (filter.toDate)
      conditions = and(conditions, lte(vouchers.voucherDate, new Date(filter.toDate)));
    if (filter.voucherType)
      conditions = and(
        conditions,
        eq(vouchers.voucherType, filter.voucherType as typeof vouchers.$inferSelect.voucherType),
      );
    if (filter.searchQuery)
      conditions = and(conditions, ilike(vouchers.voucherNumber, `%${filter.searchQuery}%`));

    const records = this.db
      .select({
        id: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherType: vouchers.voucherType,
        voucherDate: vouchers.voucherDate,
        referenceType: vouchers.referenceType,
        referenceId: vouchers.referenceId,
        narration: vouchers.narration,
        isCancelled: vouchers.isCancelled,
        totalAmount: sum(voucher_entries.debitAmount).mapWith(Number),
      })
      .from(vouchers)
      .leftJoin(voucher_entries, eq(voucher_entries.voucherId, vouchers.id))
      .where(conditions)
      .groupBy(vouchers.id)
      .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
      .all();

    return records.map((r) => ({
      ...r,
      totalAmount: Number(r.totalAmount) || 0,
    }));
  }

  public async getTrialBalance(
    companyId: string,
    financialYearId: string,
  ): Promise<TrialBalanceRowDto[]> {
    const results = this.db
      .select({
        ledgerId: voucher_entries.ledgerId,
        ledgerName: ledgers.name,
        debitTotal: sum(voucher_entries.debitAmount).mapWith(Number),
        creditTotal: sum(voucher_entries.creditAmount).mapWith(Number),
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .innerJoin(ledgers, eq(voucher_entries.ledgerId, ledgers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(vouchers.isCancelled, false),
        ),
      )
      .groupBy(voucher_entries.ledgerId)
      .all();

    return results;
  }

  public async getActiveLedgers(companyId: string): Promise<{ id: string; name: string }[]> {
    return this.db
      .select({ id: ledgers.id, name: ledgers.name })
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.isActive, true)))
      .orderBy(asc(ledgers.name))
      .all();
  }

  public async queryJournalEntries(filter: JournalQueryFilter) {
    let conditions = and(
      eq(vouchers.companyId, filter.companyId),
      eq(vouchers.financialYearId, filter.financialYearId),
      eq(vouchers.isCancelled, false),
    );

    if (filter.ledgerId) {
      conditions = and(conditions, eq(voucher_entries.ledgerId, filter.ledgerId));
    }
    if (filter.startDate) {
      conditions = and(conditions, gte(voucher_entries.entryDate, filter.startDate));
    }
    if (filter.endDate) {
      conditions = and(conditions, lte(voucher_entries.entryDate, filter.endDate));
    }
    if (filter.voucherType) {
      conditions = and(
        conditions,
        eq(vouchers.voucherType, filter.voucherType as import('@vyora/database').VoucherType),
      );
    }
    if (filter.searchQuery) {
      conditions = and(conditions, ilike(vouchers.voucherNumber, `%${filter.searchQuery}%`));
    }
    if (filter.vouchersInvolvingLedgerId) {
      conditions = and(
        conditions,
        sql`EXISTS (SELECT 1 FROM ${voucher_entries} ve WHERE ve.voucher_id = ${vouchers.id} AND ve.ledger_id = ${filter.vouchersInvolvingLedgerId})`,
      );
    }

    const query = this.db
      .select({
        id: voucher_entries.id,
        lineNumber: voucher_entries.lineNumber,
        voucherId: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        voucherType: vouchers.voucherType,
        referenceType: vouchers.referenceType,
        isCancelled: vouchers.isCancelled,
        ledgerId: voucher_entries.ledgerId,
        ledgerName: ledgers.name,
        debitAmount: voucher_entries.debitAmount,
        creditAmount: voucher_entries.creditAmount,
        narration: voucher_entries.narration,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .innerJoin(ledgers, eq(voucher_entries.ledgerId, ledgers.id))
      .where(conditions)
      .orderBy(
        asc(vouchers.voucherDate),
        asc(vouchers.createdAt),
        asc(vouchers.voucherNumber),
        asc(voucher_entries.lineNumber),
      );

    return query.all();
  }

  public async getLedgerOpeningBalance(
    ledgerId: string,
  ): Promise<{ openingBalance: number; openingType: 'Dr' | 'Cr' }> {
    const ledger = this.db
      .select({ openingBalance: ledgers.openingBalance, openingType: ledgers.openingType })
      .from(ledgers)
      .where(eq(ledgers.id, ledgerId))
      .get();
    if (!ledger) throw new Error('Ledger not found');
    return {
      openingBalance: ledger.openingBalance,
      openingType: ledger.openingType as 'Dr' | 'Cr',
    };
  }

  public async getBulkLedgerMovements(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
    includeInactive?: boolean,
  ): Promise<
    {
      ledgerId: string;
      ledgerName: string;
      groupId: string;
      openingBalance: number;
      openingType: 'Dr' | 'Cr';
      totalDebit: number;
      totalCredit: number;
    }[]
  > {
    // 1. Fetch all active ledgers
    let ledgerConditions: import('drizzle-orm').SQL<unknown> = eq(ledgers.companyId, companyId);
    if (!includeInactive) {
      ledgerConditions = and(ledgerConditions, eq(ledgers.isActive, true))!;
    }

    const activeLedgers = this.db
      .select({
        ledgerId: ledgers.id,
        ledgerName: ledgers.name,
        groupId: ledgers.groupId,
        openingBalance: ledgers.openingBalance,
        openingType: ledgers.openingType,
      })
      .from(ledgers)
      .where(ledgerConditions)
      .orderBy(asc(ledgers.name))
      .all();

    // 2. Fetch aggregated movements
    let movementConditions = and(
      eq(vouchers.companyId, companyId),
      eq(vouchers.financialYearId, financialYearId),
      eq(vouchers.isCancelled, false),
    );
    if (asOfDate) {
      movementConditions = and(movementConditions, lte(voucher_entries.entryDate, asOfDate));
    }

    const movements = this.db
      .select({
        ledgerId: voucher_entries.ledgerId,
        totalDebit: sum(voucher_entries.debitAmount).mapWith(Number),
        totalCredit: sum(voucher_entries.creditAmount).mapWith(Number),
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(movementConditions)
      .groupBy(voucher_entries.ledgerId)
      .all();

    // 3. Merge
    const movementMap = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const m of movements) {
      movementMap.set(m.ledgerId, {
        totalDebit: Number(m.totalDebit) || 0,
        totalCredit: Number(m.totalCredit) || 0,
      });
    }

    return activeLedgers.map((l) => {
      const move = movementMap.get(l.ledgerId) || { totalDebit: 0, totalCredit: 0 };
      return {
        ...l,
        openingType: l.openingType as 'Dr' | 'Cr',
        totalDebit: move.totalDebit,
        totalCredit: move.totalCredit,
      };
    });
  }

  public async getLedgerGroups(companyId: string) {
    return this.db
      .select({
        id: ledger_groups.id,
        name: ledger_groups.name,
        parentId: ledger_groups.parentGroupId,
        nature: ledger_groups.nature,
      })
      .from(ledger_groups)
      .where(eq(ledger_groups.companyId, companyId))
      .all();
  }

  /**
   * @deprecated Use getLedgerOpeningBalance and JournalQueryService instead.
   */
  public async getLedgerStatement(
    companyId: string,
    financialYearId: string,
    ledgerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{ openingBalance: number; openingType: 'Dr' | 'Cr'; rows: LedgerStatementRowDto[] }> {
    const ledger = this.db
      .select({ openingBalance: ledgers.openingBalance, openingType: ledgers.openingType })
      .from(ledgers)
      .where(eq(ledgers.id, ledgerId))
      .get();
    if (!ledger) throw new Error('Ledger not found');

    const baseOpeningValue = (ledger.openingType === 'Dr' ? 1 : -1) * (ledger.openingBalance || 0);

    const priorEntries = this.db
      .select({
        totalDebit: sum(voucher_entries.debitAmount).mapWith(Number),
        totalCredit: sum(voucher_entries.creditAmount).mapWith(Number),
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(voucher_entries.ledgerId, ledgerId),
          eq(vouchers.isCancelled, false),
          sql`${voucher_entries.entryDate} < ${fromDate.getTime()}`,
        ),
      )
      .get();

    const priorDebit = Number(priorEntries?.totalDebit) || 0;
    const priorCredit = Number(priorEntries?.totalCredit) || 0;

    const currentBalanceValue = baseOpeningValue + priorDebit - priorCredit;

    const openingBalance = Math.abs(currentBalanceValue);
    const openingType = currentBalanceValue >= 0 ? 'Dr' : 'Cr';

    const results = this.db
      .select({
        id: voucher_entries.id,
        date: voucher_entries.entryDate,
        voucherId: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherType: vouchers.voucherType,
        particulars: voucher_entries.narration,
        debitAmount: voucher_entries.debitAmount,
        creditAmount: voucher_entries.creditAmount,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(voucher_entries.ledgerId, ledgerId),
          eq(vouchers.isCancelled, false),
          gte(voucher_entries.entryDate, fromDate),
          lte(voucher_entries.entryDate, toDate),
        ),
      )
      .orderBy(asc(voucher_entries.entryDate), asc(voucher_entries.createdAt))
      .all();

    const rows: LedgerStatementRowDto[] = results.map((r) => ({
      ...r,
      particulars: r.particulars || 'No narration',
      balance: 0,
      balanceType: 'Dr', // Balance will be calculated by the service layer
    }));

    return { openingBalance, openingType, rows };
  }

  public async getVoucherEntriesByDateRange(
    companyId: string,
    financialYearId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const results = this.db
      .select({
        voucherDate: vouchers.voucherDate,
        debitAmount: voucher_entries.debitAmount,
        creditAmount: voucher_entries.creditAmount,
        nature: ledger_groups.nature,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .innerJoin(ledgers, eq(voucher_entries.ledgerId, ledgers.id))
      .innerJoin(ledger_groups, eq(ledgers.groupId, ledger_groups.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(vouchers.isCancelled, false),
          gte(vouchers.voucherDate, startDate),
          lte(vouchers.voucherDate, endDate),
        ),
      )
      .all();

    return results;
  }

  public async getDashboardMetricsData(companyId: string, financialYearId: string) {
    const activeLedgersCount = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.isActive, true)))
      .get();

    const journalVouchersCount = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(vouchers.voucherType, 'Journal'),
        ),
      )
      .get();

    // Find the latest update time across vouchers or ledgers
    const latestVoucher = this.db
      .select({ updatedAt: vouchers.updatedAt })
      .from(vouchers)
      .where(eq(vouchers.companyId, companyId))
      .orderBy(desc(vouchers.updatedAt))
      .limit(1)
      .get();

    const latestLedger = this.db
      .select({ updatedAt: ledgers.updatedAt })
      .from(ledgers)
      .where(eq(ledgers.companyId, companyId))
      .orderBy(desc(ledgers.updatedAt))
      .limit(1)
      .get();

    let lastUpdatedAt = new Date(0);
    if (latestVoucher?.updatedAt && latestVoucher.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = latestVoucher.updatedAt;
    }
    if (latestLedger?.updatedAt && latestLedger.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = latestLedger.updatedAt;
    }

    // Recent Journals
    const recentJournalVouchers = this.db
      .select({
        id: vouchers.id,
        date: vouchers.voucherDate,
        voucherNumber: vouchers.voucherNumber,
        totalAmount: sum(voucher_entries.debitAmount).mapWith(Number),
      })
      .from(vouchers)
      .leftJoin(voucher_entries, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(vouchers.voucherType, 'Journal'),
        ),
      )
      .groupBy(vouchers.id)
      .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
      .limit(5)
      .all();

    return {
      totalLedgers: Number(activeLedgersCount?.count) || 0,
      totalJournalEntries: Number(journalVouchersCount?.count) || 0,
      lastUpdatedAt: lastUpdatedAt.getTime() === 0 ? new Date() : lastUpdatedAt,
      recentJournals: recentJournalVouchers.map((v) => ({
        id: v.id,
        date: v.date,
        voucherNumber: v.voucherNumber,
        amount: v.totalAmount || 0,
      })),
    };
  }
  public async getTransferRegisterEntries(
    companyId: string,
    financialYearId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    let conditions = and(
      eq(vouchers.companyId, companyId),
      eq(vouchers.financialYearId, financialYearId),
      eq(vouchers.referenceType, 'FUND_TRANSFER'),
      eq(vouchers.voucherType, 'Contra'),
    );
    if (startDate) {
      conditions = and(conditions, gte(vouchers.voucherDate, startDate));
    }
    if (endDate) {
      conditions = and(conditions, lte(vouchers.voucherDate, endDate));
    }

    const rows = this.db
      .select({
        voucherId: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        isCancelled: vouchers.isCancelled,
        createdAt: vouchers.createdAt,
        ledgerId: voucher_entries.ledgerId,
        ledgerName: ledgers.name,
        debitAmount: voucher_entries.debitAmount,
        creditAmount: voucher_entries.creditAmount,
        narration: vouchers.narration,
        entryId: voucher_entries.id,
      })
      .from(vouchers)
      .innerJoin(voucher_entries, eq(vouchers.id, voucher_entries.voucherId))
      .innerJoin(ledgers, eq(voucher_entries.ledgerId, ledgers.id))
      .where(conditions)
      .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
      .all();

    return rows;
  }
}

export const journalRepository = new JournalRepository();
