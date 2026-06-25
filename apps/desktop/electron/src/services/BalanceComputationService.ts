import { JournalEntryRow, MonetaryBalance } from '@vyora/types';

export class BalanceComputationService {
  /**
   * Calculates the net balance by applying a series of debits and credits
   * to an initial base balance.
   */
  public calculateNetBalance(
    baseBalance: number,
    baseType: 'Dr' | 'Cr',
    totalDebit: number,
    totalCredit: number,
  ): MonetaryBalance {
    const baseValue = (baseType === 'Dr' ? 1 : -1) * (baseBalance || 0);
    const currentValue = baseValue + totalDebit - totalCredit;

    return {
      amount: Math.abs(currentValue),
      type: currentValue >= 0 ? 'Dr' : 'Cr',
    };
  }

  /**
   * Adjusts an opening balance based on a set of prior entries.
   * Useful when fetching a ledger statement from a mid-year date.
   */
  public computeAdjustedOpeningBalance(
    initialBalance: number,
    initialType: 'Dr' | 'Cr',
    priorEntries: JournalEntryRow[],
  ): MonetaryBalance {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of priorEntries) {
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;
    }

    return this.calculateNetBalance(initialBalance, initialType, totalDebit, totalCredit);
  }

  /**
   * Computes the running balance for a chronological list of entries,
   * returning a new array with `.runningBalance` populated.
   */
  public computeRunningBalances(
    openingBalance: number,
    openingType: 'Dr' | 'Cr',
    entries: JournalEntryRow[],
  ): JournalEntryRow[] {
    let runningValue = (openingType === 'Dr' ? 1 : -1) * (openingBalance || 0);

    return entries.map((entry) => {
      runningValue += entry.debitAmount - entry.creditAmount;
      return {
        ...entry,
        runningBalance: {
          amount: Math.abs(runningValue),
          type: runningValue >= 0 ? 'Dr' : 'Cr',
        },
      };
    });
  }

  /**
   * Computes closing balances for a bulk array of ledger movements.
   */
  public computeBulkClosingBalances(
    movements: {
      ledgerId: string;
      ledgerName: string;
      groupId: string;
      openingBalance: number;
      openingType: 'Dr' | 'Cr';
      totalDebit: number;
      totalCredit: number;
    }[],
  ): {
    ledgerId: string;
    ledgerName: string;
    groupId: string;
    closingBalance: import('@vyora/types').MonetaryBalance;
  }[] {
    return movements.map((m) => {
      const baseOpeningValue = (m.openingType === 'Dr' ? 1 : -1) * (m.openingBalance || 0);
      const currentBalanceValue = baseOpeningValue + m.totalDebit - m.totalCredit;
      const amount = Math.abs(currentBalanceValue);
      const type = currentBalanceValue >= 0 ? 'Dr' : 'Cr';

      return {
        ledgerId: m.ledgerId,
        ledgerName: m.ledgerName,
        groupId: m.groupId,
        closingBalance: { amount, type },
      };
    });
  }
}

export const balanceComputationService = new BalanceComputationService();
