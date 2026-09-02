import { JournalQueryFilter, JournalEntryRow } from '@vyora/types';

import { journalRepository } from '../repositories/JournalRepository';

export class JournalQueryService {
  public async getJournalEntries(filter: JournalQueryFilter): Promise<JournalEntryRow[]> {
    const rawRows = await journalRepository.queryJournalEntries(filter);

    // Identify Contra vouchers that need narration enrichment
    const contraVoucherIds = new Set<string>();
    for (const row of rawRows) {
      if (row.voucherType === 'Contra') {
        contraVoucherIds.add(row.voucherId);
      }
    }

    if (contraVoucherIds.size > 0) {
      const { dbService } = await import('./database/DatabaseService');
      const { vouchers, voucher_entries, ledgers } = await import('@vyora/database');
      const { inArray, eq, sql } = await import('drizzle-orm');

      const db = dbService.getDb();
      const transferData = await db
        .select({
          id: vouchers.id,
          debitAccountName: sql<string>`MAX(CASE WHEN ${voucher_entries.debitAmount} > 0 THEN ${ledgers.name} ELSE NULL END)`,
          creditAccountName: sql<string>`MAX(CASE WHEN ${voucher_entries.creditAmount} > 0 THEN ${ledgers.name} ELSE NULL END)`,
        })
        .from(vouchers)
        .leftJoin(voucher_entries, eq(voucher_entries.voucherId, vouchers.id))
        .leftJoin(ledgers, eq(ledgers.id, voucher_entries.ledgerId))
        .where(inArray(vouchers.id, Array.from(contraVoucherIds)))
        .groupBy(vouchers.id)
        .all();

      const transferMap = new Map(transferData.map((t) => [t.id, t]));

      for (const row of rawRows) {
        if (contraVoucherIds.has(row.voucherId)) {
          const t = transferMap.get(row.voucherId);
          if (t && t.creditAccountName && t.debitAccountName) {
            const hasCustomNarration =
              row.narration && row.narration !== '—' && !row.narration.startsWith('Fund transfer:');
            if (hasCustomNarration) {
              row.narration = `${t.creditAccountName} → ${t.debitAccountName}\n${row.narration}`;
            } else {
              row.narration = `${t.creditAccountName} → ${t.debitAccountName}`;
            }
          }
        }
      }
    }

    return rawRows.map((row) => ({
      entryId: row.id,
      lineNumber: row.lineNumber,
      voucherId: row.voucherId,
      voucherNumber: row.voucherNumber,
      voucherDate: row.voucherDate,
      voucherType: row.voucherType,
      ledgerId: row.ledgerId,
      ledgerName: row.ledgerName,
      debitAmount: row.debitAmount,
      creditAmount: row.creditAmount,
      narration: row.narration,
    }));
  }

  public async getLedgerOpeningBalance(
    ledgerId: string,
  ): Promise<{ openingBalance: number; openingType: 'Dr' | 'Cr' }> {
    return await journalRepository.getLedgerOpeningBalance(ledgerId);
  }

  public async getBulkLedgerMovements(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
    includeInactive?: boolean,
  ) {
    return await journalRepository.getBulkLedgerMovements(
      companyId,
      financialYearId,
      asOfDate,
      includeInactive,
    );
  }

  public async getLedgerGroups(companyId: string) {
    return await journalRepository.getLedgerGroups(companyId);
  }

  public async getTransferRegisterEntries(
    companyId: string,
    financialYearId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return await journalRepository.getTransferRegisterEntries(
      companyId,
      financialYearId,
      startDate,
      endDate,
    );
  }
}

export const journalQueryService = new JournalQueryService();
