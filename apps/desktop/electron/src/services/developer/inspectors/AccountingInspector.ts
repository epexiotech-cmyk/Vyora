import { ledgers, voucher_entries, vouchers } from '@vyora/database';
import { eq, sql, and, isNull } from 'drizzle-orm';

import { dbService } from '../../database/DatabaseService';
import { IDatabaseInspector, InspectorRelation } from '../InspectorRegistry';

export class AccountingInspector implements IDatabaseInspector {
  public readonly name = 'AccountingInspector';

  public async getRelations(
    tableName: string,
    row: Record<string, unknown>,
  ): Promise<InspectorRelation[]> {
    if (tableName !== 'payment_accounts') return [];

    const db = dbService.getDb();
    const accountId = row.id as string;
    const ledgerId = row.ledgerId as string;

    if (!accountId || !ledgerId) return [];

    const relations: InspectorRelation[] = [];

    // 1. Ledger
    const ledger = await db.select().from(ledgers).where(eq(ledgers.id, ledgerId)).get();

    if (ledger) {
      relations.push({
        label: `Ledger (${ledger.name})`,
        type: 'ledgers',
        id: ledger.id,
        metadata: {
          openingBalance: ledger.openingBalance,
          openingType: ledger.openingType,
          isActive: ledger.isActive,
        },
      });
    }

    // 2. Opening Balance Voucher
    const ob = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.referenceId, accountId),
          eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
          isNull(vouchers.deletedAt),
        ),
      )
      .get();

    if (ob) {
      relations.push({
        label: `Opening Balance Voucher (${ob.voucherNumber})`,
        type: 'vouchers',
        id: ob.id,
        metadata: {
          voucherDate: ob.voucherDate,
        },
      });
    }

    // 3. Journal Entries (count)
    const journalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucher_entries.ledgerId, ledgerId),
          eq(vouchers.isCancelled, false),
          isNull(vouchers.deletedAt),
        ),
      )
      .get();

    const journalCount = journalResult?.count || 0;
    if (journalCount > 0) {
      relations.push({
        label: `Journal Entries (${journalCount})`,
        type: 'voucher_entries', // using the table name for navigation
        id: ledgerId, // Not a specific ID, but can be used for querying
        metadata: {
          count: journalCount,
          filter: `ledgerId = '${ledgerId}'`,
        },
      });
    }

    return relations;
  }

  public async getBadges(tableName: string, row: Record<string, unknown>): Promise<string[]> {
    if (tableName !== 'payment_accounts') return [];

    const db = dbService.getDb();
    const accountId = row.id as string;
    const ledgerId = row.ledgerId as string;
    const badges: string[] = [];

    if (row.isActive) badges.push('success:Active');
    else badges.push('secondary:Inactive');

    if (row.deletedAt) badges.push('destructive:Deleted');

    if (ledgerId) {
      const journalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(voucher_entries)
        .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
        .where(
          and(
            eq(voucher_entries.ledgerId, ledgerId),
            eq(vouchers.isCancelled, false),
            isNull(vouchers.deletedAt),
          ),
        )
        .get();

      if ((journalResult?.count || 0) > 0) {
        badges.push('warning:Has History');
      }
    }

    if (accountId) {
      const ob = await db
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.referenceId, accountId),
            eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
            isNull(vouchers.deletedAt),
          ),
        )
        .get();

      if (ob) badges.push('info:Opening Balance');
    }

    return badges;
  }
}
