import { randomUUID } from 'crypto';

import {
  vouchers,
  voucher_entries,
  InsertVoucher,
  InsertVoucherEntry,
  Voucher,
  ledgers,
} from '@vyora/database';
import {
  VoucherListItemDto,
  VoucherFilterDto,
  VoucherDetailDto,
  TrialBalanceRowDto,
  LedgerStatementRowDto,
  AccountingDashboardDto,
  JournalQueryFilter,
} from '@vyora/types';
import { eq, and, gte, lte, desc, asc, sql, ilike } from 'drizzle-orm';

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
   * Generates a cancellation/reversal voucher that inverses the original entry.
   * Does NOT delete the original.
   */
  public cancelVoucher(
    originalVoucherId: string,
    reversalVoucher: InsertVoucher,
    tx: TransactionExecutor,
  ): Voucher {
    // 1. Fetch original entries
    const originalEntries = tx
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, originalVoucherId))
      .all();
    if (!originalEntries.length) {
      throw new Error(
        `Cannot cancel voucher: No entries found for voucher ID ${originalVoucherId}`,
      );
    }

    // 2. Insert the reversal voucher header
    reversalVoucher.reversalVoucherId = originalVoucherId; // link back
    const createdReversalVoucher = tx.insert(vouchers).values(reversalVoucher).returning().get();

    // 3. Insert inverse entries (swap debits and credits)
    const reversalEntries: InsertVoucherEntry[] = originalEntries.map((entry, index) => ({
      id: randomUUID(), // assume crypto.randomUUID is handled or passed if generated
      voucherId: createdReversalVoucher.id,
      lineNumber: index + 1,
      ledgerId: entry.ledgerId,
      debitAmount: entry.creditAmount, // Swapped
      creditAmount: entry.debitAmount, // Swapped
      entryDate: reversalVoucher.voucherDate as Date,
      narration: `Reversal of ${originalVoucherId}`,
      createdAt: new Date(),
    }));

    tx.insert(voucher_entries).values(reversalEntries).run();

    // 4. Mark original as cancelled
    tx.update(vouchers)
      .set({ isCancelled: true, updatedAt: new Date() })
      .where(eq(vouchers.id, originalVoucherId))
      .run();

    return createdReversalVoucher;
  }

  public async getVoucherById(voucherId: string): Promise<VoucherDetailDto> {
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
        totalAmount: sql<number>`(SELECT SUM(${voucher_entries.debitAmount}) FROM ${voucher_entries} WHERE ${voucher_entries.voucherId} = ${vouchers.id})`,
      })
      .from(vouchers)
      .where(conditions)
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
        debitTotal: sql<number>`SUM(CAST(${voucher_entries.debitAmount} AS INTEGER))`,
        creditTotal: sql<number>`SUM(CAST(${voucher_entries.creditAmount} AS INTEGER))`,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .innerJoin(ledgers, eq(voucher_entries.ledgerId, ledgers.id))
      .where(and(eq(vouchers.companyId, companyId), eq(vouchers.financialYearId, financialYearId)))
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

    const query = this.db
      .select({
        id: voucher_entries.id,
        voucherId: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        voucherType: vouchers.voucherType,
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
      .orderBy(asc(voucher_entries.entryDate), asc(voucher_entries.createdAt));

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
        totalDebit: sql<number>`SUM(CAST(${voucher_entries.debitAmount} AS INTEGER))`,
        totalCredit: sql<number>`SUM(CAST(${voucher_entries.creditAmount} AS INTEGER))`,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.financialYearId, financialYearId),
          eq(voucher_entries.ledgerId, ledgerId),
          sql`${voucher_entries.entryDate} < ${fromDate}`,
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
          gte(voucher_entries.entryDate, fromDate),
          lte(voucher_entries.entryDate, toDate),
        ),
      )
      .orderBy(asc(voucher_entries.entryDate), asc(voucher_entries.createdAt))
      .all();

    let runningBalance = currentBalanceValue;
    const rows: LedgerStatementRowDto[] = [];
    for (const r of results) {
      runningBalance += r.debitAmount - r.creditAmount;
      rows.push({
        ...r,
        particulars: r.particulars || 'No narration',
        balance: Math.abs(runningBalance),
        balanceType: runningBalance >= 0 ? 'Dr' : 'Cr',
      });
    }

    return { openingBalance, openingType, rows };
  }

  public async getDashboardMetrics(
    companyId: string,
    financialYearId: string,
  ): Promise<AccountingDashboardDto> {
    const records = this.db
      .select({ type: vouchers.voucherType, count: sql<number>`COUNT(*)` })
      .from(vouchers)
      .where(and(eq(vouchers.companyId, companyId), eq(vouchers.financialYearId, financialYearId)))
      .groupBy(vouchers.voucherType)
      .all();

    let totalVouchers = 0;
    let salesVoucherCount = 0;
    let purchaseVoucherCount = 0;

    for (const r of records) {
      const c = Number(r.count);
      totalVouchers += c;
      if (r.type === 'Sales') salesVoucherCount += c;
      if (r.type === 'Purchase') purchaseVoucherCount += c;
    }

    return { totalVouchers, salesVoucherCount, purchaseVoucherCount };
  }
}

export const journalRepository = new JournalRepository();
