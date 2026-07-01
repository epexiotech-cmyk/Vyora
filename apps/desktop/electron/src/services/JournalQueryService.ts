import { JournalQueryFilter, JournalEntryRow } from '@vyora/types';

import { journalRepository } from '../repositories/JournalRepository';

export class JournalQueryService {
  public async getJournalEntries(filter: JournalQueryFilter): Promise<JournalEntryRow[]> {
    const rawRows = await journalRepository.queryJournalEntries(filter);

    return rawRows.map((row) => ({
      entryId: row.id,
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
}

export const journalQueryService = new JournalQueryService();
