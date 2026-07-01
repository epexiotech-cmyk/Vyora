import { GeneralLedgerReport, GeneralLedgerStatement, GeneralLedgerEntry } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { generalLedgerQueryService } from './GeneralLedgerQueryService';

export class GeneralLedgerService {
  /**
   * Generates a complete General Ledger report for a specific date range.
   */
  public async getGeneralLedger(
    companyId: string,
    financialYearId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<GeneralLedgerReport> {
    // 1. Fetch grouped datasets
    const { bulkMovements, entriesByLedger } = await generalLedgerQueryService.getGroupedLedgerData(
      companyId,
      financialYearId,
      startDate,
      endDate,
    );

    const statements: GeneralLedgerStatement[] = [];

    // 2. Compute ledger statements using BalanceComputationService
    for (const movement of bulkMovements) {
      const ledgerId = movement.ledgerId;
      const ledgerName = movement.ledgerName;
      const entries = entriesByLedger.get(ledgerId) || [];

      // If there are no entries for the period and the opening balance is 0, we can optionally skip
      // but standard GLs often show ledgers that had activity or have a balance.
      // We will include it if it has a non-zero opening balance OR has entries.

      const nativeOpeningValue =
        (movement.openingType === 'Dr' ? 1 : -1) * (movement.openingBalance || 0);
      const movementValue = movement.totalDebit - movement.totalCredit;
      const adjustedOpeningValue = nativeOpeningValue + movementValue;

      const adjustedOpeningBalanceAmount = Math.abs(adjustedOpeningValue);
      const adjustedOpeningBalanceType = adjustedOpeningValue >= 0 ? 'Dr' : 'Cr';

      if (adjustedOpeningBalanceAmount === 0 && entries.length === 0) {
        // Skip entirely empty ledgers for the period
        continue;
      }

      const entriesWithRunningBalances = balanceComputationService.computeRunningBalances(
        adjustedOpeningBalanceAmount,
        adjustedOpeningBalanceType,
        entries,
      );

      const closingBalance =
        entriesWithRunningBalances.length > 0
          ? entriesWithRunningBalances[entriesWithRunningBalances.length - 1].runningBalance!
          : { amount: adjustedOpeningBalanceAmount, type: adjustedOpeningBalanceType };

      // Map JournalEntryRow to GeneralLedgerEntry
      const mappedEntries: GeneralLedgerEntry[] = entriesWithRunningBalances.map((e) => ({
        entryId: e.entryId,
        voucherId: e.voucherId,
        voucherNumber: e.voucherNumber,
        voucherDate: e.voucherDate,
        voucherType: e.voucherType,
        ledgerId,
        ledgerName,
        narration: e.narration || '',
        debitAmount: e.debitAmount,
        creditAmount: e.creditAmount,
        runningBalance: e.runningBalance!,
      }));

      statements.push({
        ledgerId,
        ledgerName,
        openingBalance: {
          amount: adjustedOpeningBalanceAmount,
          type: adjustedOpeningBalanceType,
        },
        closingBalance,
        entries: mappedEntries,
      });
    }

    return {
      companyId,
      financialYearId,
      startDate,
      endDate,
      statements,
    };
  }
}

export const generalLedgerService = new GeneralLedgerService();
