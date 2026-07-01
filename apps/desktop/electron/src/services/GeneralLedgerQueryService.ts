import { JournalQueryFilter, JournalEntryRow } from '@vyora/types';

import { journalQueryService } from './JournalQueryService';

export class GeneralLedgerQueryService {
  /**
   * Fetches bulk opening balances and groups raw entries by ledger.
   */
  public async getGroupedLedgerData(
    companyId: string,
    financialYearId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // 1. Fetch bulk adjusted opening balances up to startDate (including inactive ledgers that might have entries)
    // We pass startDate - 1 millisecond as the asOfDate to get balances *before* the start date.
    const asOfDate = startDate ? new Date(startDate.getTime() - 1) : undefined;
    const bulkMovements = await journalQueryService.getBulkLedgerMovements(
      companyId,
      financialYearId,
      asOfDate,
      true, // includeInactive
    );

    // 2. Fetch all journal entries for the period
    const filter: JournalQueryFilter = {
      companyId,
      financialYearId,
      startDate,
      endDate,
    };
    const periodEntries = await journalQueryService.getJournalEntries(filter);

    // 3. Group entries by ledgerId in memory (O(N))
    const entriesByLedger = new Map<string, JournalEntryRow[]>();
    for (const entry of periodEntries) {
      if (!entriesByLedger.has(entry.ledgerId)) {
        entriesByLedger.set(entry.ledgerId, []);
      }
      entriesByLedger.get(entry.ledgerId)!.push(entry);
    }

    return {
      bulkMovements,
      entriesByLedger,
    };
  }
}

export const generalLedgerQueryService = new GeneralLedgerQueryService();
