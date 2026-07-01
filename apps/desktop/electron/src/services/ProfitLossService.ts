import {
  ProfitLossGroup,
  ProfitLossReport,
  TrialBalanceGroup,
  MonetaryBalance,
} from '@vyora/types';

import { trialBalanceService } from './TrialBalanceService';

export class ProfitLossService {
  /**
   * Generates a Profit & Loss Report using the Trial Balance as the source of truth.
   */
  public async getProfitLoss(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<ProfitLossReport> {
    const trialBalance = await trialBalanceService.getTrialBalance(
      companyId,
      financialYearId,
      asOfDate,
    );

    const incomeGroups: ProfitLossGroup[] = [];
    const expenseGroups: ProfitLossGroup[] = [];

    let totalIncomeSigned = 0;
    let totalExpenseSigned = 0;

    for (const group of trialBalance.groups) {
      if (group.nature === 'Income') {
        const plGroup = this.mapToProfitLossGroup(group);
        incomeGroups.push(plGroup);
        totalIncomeSigned += this.toSignedAmount(plGroup.totalBalance);
      } else if (group.nature === 'Expense') {
        const plGroup = this.mapToProfitLossGroup(group);
        expenseGroups.push(plGroup);
        totalExpenseSigned += this.toSignedAmount(plGroup.totalBalance);
      }
    }

    const totalIncome = this.fromSignedAmount(totalIncomeSigned);
    const totalExpense = this.fromSignedAmount(totalExpenseSigned);

    // Net algebraic balance: Income (typically Cr/-) + Expense (typically Dr/+)
    const netResultSigned = totalIncomeSigned + totalExpenseSigned;
    const netResult = this.fromSignedAmount(netResultSigned);

    // In accounting, a net Cr balance from operations indicates Profit. A net Dr balance indicates Loss.
    const isProfit = netResultSigned <= 0; // Negative or zero signed amount means Cr (Profit) or Breakeven

    return {
      companyId,
      financialYearId,
      asOfDate: asOfDate || new Date(),
      incomeGroups,
      expenseGroups,
      totalIncome,
      totalExpense,
      netResult,
      isProfit,
    };
  }

  private mapToProfitLossGroup(group: TrialBalanceGroup): ProfitLossGroup {
    return {
      groupId: group.groupId,
      groupName: group.groupName,
      parentGroupId: group.parentGroupId,
      nature: group.nature as 'Income' | 'Expense',
      totalBalance: { ...group.totalBalance },
      ledgers: group.ledgers.map((l) => ({
        ledgerId: l.ledgerId,
        ledgerName: l.ledgerName,
        groupId: l.groupId,
        balance: { ...l.closingBalance },
      })),
      subGroups: group.subGroups.map((g) => this.mapToProfitLossGroup(g)),
    };
  }

  /**
   * Converts a MonetaryBalance to a signed numeric amount.
   * Debit is positive (+), Credit is negative (-).
   */
  private toSignedAmount(balance: MonetaryBalance): number {
    return balance.type === 'Dr' ? balance.amount : -balance.amount;
  }

  /**
   * Converts a signed numeric amount back into a MonetaryBalance.
   */
  private fromSignedAmount(amount: number): MonetaryBalance {
    return {
      amount: Math.abs(amount),
      type: amount >= 0 ? 'Dr' : 'Cr',
    };
  }
}

export const profitLossService = new ProfitLossService();
