import { vouchers, voucher_entries, payment_accounts } from '@vyora/database';
import { FundTransferQueryFilter } from '@vyora/types';
import { and, eq, sql, desc, isNotNull } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class FundTransferRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async getFundTransfers(
    companyId: string,
    financialYearId: string,
    filter: FundTransferQueryFilter,
    tx?: DbTransaction,
  ) {
    const db = tx || this.db;

    let conditions = and(
      eq(vouchers.companyId, companyId),
      eq(vouchers.financialYearId, financialYearId),
      eq(vouchers.referenceType, 'FUND_TRANSFER'),
      isNotNull(vouchers.referenceId),
    );

    if (filter.startDate) {
      conditions = and(conditions, sql`${vouchers.voucherDate} >= ${filter.startDate.getTime()}`);
    }
    if (filter.endDate) {
      conditions = and(conditions, sql`${vouchers.voucherDate} <= ${filter.endDate.getTime()}`);
    }
    if (filter.voucherNumber) {
      conditions = and(
        conditions,
        sql`${vouchers.voucherNumber} LIKE ${`%${filter.voucherNumber}%`}`,
      );
    }
    if (filter.isActive !== undefined) {
      conditions = and(conditions, eq(vouchers.isCancelled, !filter.isActive));
    }
    if (filter.transferType) {
      conditions = and(conditions, sql`${vouchers.narration} LIKE ${`%${filter.transferType}%`}`);
    }

    const records = await db
      .select({
        id: sql<string>`${vouchers.referenceId}`,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        narration: vouchers.narration,
        isCancelled: vouchers.isCancelled,
        createdAt: vouchers.createdAt,
        debitLedgerId: sql<string>`MAX(CASE WHEN ${voucher_entries.debitAmount} > 0 THEN ${voucher_entries.ledgerId} ELSE NULL END)`,
        creditLedgerId: sql<string>`MAX(CASE WHEN ${voucher_entries.creditAmount} > 0 THEN ${voucher_entries.ledgerId} ELSE NULL END)`,
        amount: sql<number>`MAX(CASE WHEN ${voucher_entries.creditAmount} > 0 THEN ${voucher_entries.creditAmount} ELSE 0 END)`,
        debitAccountId: sql<string>`MAX(CASE WHEN ${voucher_entries.debitAmount} > 0 THEN ${payment_accounts.id} ELSE NULL END)`,
        debitAccountName: sql<string>`MAX(CASE WHEN ${voucher_entries.debitAmount} > 0 THEN ${payment_accounts.displayName} ELSE NULL END)`,
        creditAccountId: sql<string>`MAX(CASE WHEN ${voucher_entries.creditAmount} > 0 THEN ${payment_accounts.id} ELSE NULL END)`,
        creditAccountName: sql<string>`MAX(CASE WHEN ${voucher_entries.creditAmount} > 0 THEN ${payment_accounts.displayName} ELSE NULL END)`,
      })
      .from(vouchers)
      .leftJoin(voucher_entries, eq(voucher_entries.voucherId, vouchers.id))
      .leftJoin(payment_accounts, eq(payment_accounts.ledgerId, voucher_entries.ledgerId))
      .where(conditions)
      .groupBy(vouchers.id)
      .limit(filter.limit || 50)
      .offset(filter.offset || 0)
      .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
      .all();

    const total = await db
      .select({ count: sql<number>`count(DISTINCT ${vouchers.id})` })
      .from(vouchers)
      .leftJoin(voucher_entries, eq(voucher_entries.voucherId, vouchers.id))
      .where(conditions)
      .get();

    return { records, total: total?.count || 0 };
  }
}

export const fundTransferRepository = new FundTransferRepository();
