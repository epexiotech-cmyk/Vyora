import { JournalQueryFilter, LedgerStatementReport } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';

export class LedgerStatementService {
  /**
   * Generates a Ledger Statement Report for a specific date range.
   */
  public async getLedgerStatement(
    companyId: string,
    financialYearId: string,
    ledgerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<LedgerStatementReport> {
    // 1. Fetch native opening balance for the ledger
    const { openingBalance, openingType } =
      await journalQueryService.getLedgerOpeningBalance(ledgerId);

    let adjustedOpeningBalance = { amount: openingBalance, type: openingType };

    // 2. Query entries before the start date to compute adjusted opening balance
    if (startDate) {
      const priorFilter: JournalQueryFilter = {
        companyId,
        financialYearId,
        ledgerId,
        // Fetch everything strictly before the startDate
        endDate: new Date(startDate.getTime() - 1),
      };
      const priorEntries = await journalQueryService.getJournalEntries(priorFilter);

      adjustedOpeningBalance = balanceComputationService.computeAdjustedOpeningBalance(
        openingBalance,
        openingType,
        priorEntries,
      );
    }

    // 3. Query entries for the actual requested period
    const periodFilter: JournalQueryFilter = {
      companyId,
      financialYearId,
      ledgerId,
      startDate,
      endDate,
    };
    const periodEntries = await journalQueryService.getJournalEntries(periodFilter);

    // 4. Compute running balances for the period entries
    const entriesWithRunningBalances = balanceComputationService.computeRunningBalances(
      adjustedOpeningBalance.amount,
      adjustedOpeningBalance.type,
      periodEntries,
    );

    // 5. Derive the final closing balance
    const closingBalance =
      entriesWithRunningBalances.length > 0
        ? entriesWithRunningBalances[entriesWithRunningBalances.length - 1].runningBalance!
        : adjustedOpeningBalance;

    // 6. Return the orchestrated report DTO
    return {
      companyId,
      financialYearId,
      ledgerId,
      startDate,
      endDate,
      openingBalance: adjustedOpeningBalance,
      closingBalance,
      entries: entriesWithRunningBalances,
    };
  }
}

export const ledgerStatementService = new LedgerStatementService();
