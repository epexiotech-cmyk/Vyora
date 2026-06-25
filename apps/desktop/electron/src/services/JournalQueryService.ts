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
    return journalRepository.getLedgerOpeningBalance(ledgerId);
  }
}

export const journalQueryService = new JournalQueryService();
