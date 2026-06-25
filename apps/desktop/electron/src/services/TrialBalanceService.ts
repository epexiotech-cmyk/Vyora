import { TrialBalanceReport } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';
import { trialBalanceAggregationService } from './TrialBalanceAggregationService';

export class TrialBalanceService {
  /**
   * Generates a hierarchical Trial Balance report for a specific date.
   */
  public async getTrialBalance(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<TrialBalanceReport> {
    // 1. Fetch bulk movements and groups from the query service
    const movements = await journalQueryService.getBulkLedgerMovements(
      companyId,
      financialYearId,
      asOfDate,
    );
    const groups = await journalQueryService.getLedgerGroups(companyId);

    // 2. Compute bulk closing balances for ledgers
    const ledgerBalances = balanceComputationService.computeBulkClosingBalances(movements);

    // 3. Aggregate into tree structure
    const topLevelGroups = trialBalanceAggregationService.aggregate(ledgerBalances, groups);

    // 4. Calculate grand totals
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const g of topLevelGroups) {
      if (g.totalBalance.type === 'Dr') {
        grandTotalDebit += g.totalBalance.amount;
      } else {
        grandTotalCredit += g.totalBalance.amount;
      }
    }

    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

    return {
      companyId,
      financialYearId,
      asOfDate: asOfDate || new Date(),
      groups: topLevelGroups,
      grandTotalDebit,
      grandTotalCredit,
      isBalanced,
    };
  }
}

export const trialBalanceService = new TrialBalanceService();
