import { randomUUID } from 'crypto';

import {
  BalanceSheetReport,
  BalanceSheetGroup,
  BalanceSheetRow,
  TrialBalanceGroup,
  MonetaryBalance,
} from '@vyora/types';

import { profitLossService } from './ProfitLossService';
import { trialBalanceService } from './TrialBalanceService';

export class BalanceSheetService {
  /**
   * Generates a Balance Sheet using Trial Balance and Profit & Loss as data sources.
   */
  public async getBalanceSheet(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<BalanceSheetReport> {
    const trialBalance = await trialBalanceService.getTrialBalance(
      companyId,
      financialYearId,
      asOfDate,
    );
    const profitLoss = await profitLossService.getProfitLoss(companyId, financialYearId, asOfDate);

    const assetGroups: BalanceSheetGroup[] = [];
    const liabilityGroups: BalanceSheetGroup[] = [];
    const equityGroups: BalanceSheetGroup[] = [];

    let totalAssetsSigned = 0;
    let totalLiabilitiesSigned = 0;
    let totalEquitySigned = 0;

    for (const tbGroup of trialBalance.groups) {
      if (tbGroup.nature === 'Asset') {
        const bsGroup = this.mapToBalanceSheetGroup(tbGroup);
        assetGroups.push(bsGroup);
        totalAssetsSigned += this.toSignedAmount(bsGroup.totalBalance);
      } else if (tbGroup.nature === 'Liability') {
        const bsGroup = this.mapToBalanceSheetGroup(tbGroup);
        liabilityGroups.push(bsGroup);
        totalLiabilitiesSigned += this.toSignedAmount(bsGroup.totalBalance);
      } else if (tbGroup.nature === 'Equity') {
        const bsGroup = this.mapToBalanceSheetGroup(tbGroup);
        equityGroups.push(bsGroup);
        totalEquitySigned += this.toSignedAmount(bsGroup.totalBalance);
      }
    }

    // Virtual ledger for Current Period Profit / Loss
    const plLedger: BalanceSheetRow = {
      ledgerId: 'virtual-current-period-pl',
      ledgerName: 'Current Period Profit / Loss',
      groupId: '',
      balance: { ...profitLoss.netResult },
    };

    const plSigned = this.toSignedAmount(plLedger.balance);

    if (equityGroups.length > 0) {
      plLedger.groupId = equityGroups[0].groupId;
      equityGroups[0].ledgers.push(plLedger);

      const oldGroupSigned = this.toSignedAmount(equityGroups[0].totalBalance);
      equityGroups[0].totalBalance = this.fromSignedAmount(oldGroupSigned + plSigned);
    } else {
      const syntheticGroupId = randomUUID();
      plLedger.groupId = syntheticGroupId;
      const syntheticGroup: BalanceSheetGroup = {
        groupId: syntheticGroupId,
        groupName: 'Equity',
        parentGroupId: null,
        nature: 'Equity',
        totalBalance: { ...plLedger.balance },
        ledgers: [plLedger],
        subGroups: [],
      };
      equityGroups.push(syntheticGroup);
    }

    totalEquitySigned += plSigned;

    const totalAssets = this.fromSignedAmount(totalAssetsSigned);
    const totalLiabilities = this.fromSignedAmount(totalLiabilitiesSigned);
    const totalEquity = this.fromSignedAmount(totalEquitySigned);

    const differenceSigned = totalAssetsSigned + totalLiabilitiesSigned + totalEquitySigned;

    const isBalanced = Math.abs(differenceSigned) < 0.01;
    const difference = this.fromSignedAmount(differenceSigned);

    return {
      companyId,
      financialYearId,
      asOfDate: asOfDate || new Date(),
      assetGroups,
      liabilityGroups,
      equityGroups,
      totalAssets,
      totalLiabilities,
      totalEquity,
      difference,
      isBalanced,
    };
  }

  private mapToBalanceSheetGroup(group: TrialBalanceGroup): BalanceSheetGroup {
    return {
      groupId: group.groupId,
      groupName: group.groupName,
      parentGroupId: group.parentGroupId,
      nature: group.nature as 'Asset' | 'Liability' | 'Equity',
      totalBalance: { ...group.totalBalance },
      ledgers: group.ledgers.map((l) => ({
        ledgerId: l.ledgerId,
        ledgerName: l.ledgerName,
        groupId: l.groupId,
        balance: { ...l.closingBalance },
      })),
      subGroups: group.subGroups.map((g) => this.mapToBalanceSheetGroup(g)),
    };
  }

  private toSignedAmount(balance: MonetaryBalance): number {
    return balance.type === 'Dr' ? balance.amount : -balance.amount;
  }

  private fromSignedAmount(amount: number): MonetaryBalance {
    return {
      amount: Math.abs(amount),
      type: amount >= 0 ? 'Dr' : 'Cr',
    };
  }
}

export const balanceSheetService = new BalanceSheetService();
