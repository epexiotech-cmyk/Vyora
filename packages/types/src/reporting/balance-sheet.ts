import { MonetaryBalance } from './balances';

export interface BalanceSheetRow {
  ledgerId: string;
  ledgerName: string;
  groupId: string;
  balance: MonetaryBalance;
}

export interface BalanceSheetGroup {
  groupId: string;
  groupName: string;
  parentGroupId: string | null;
  nature: 'Asset' | 'Liability' | 'Equity';
  totalBalance: MonetaryBalance;
  ledgers: BalanceSheetRow[];
  subGroups: BalanceSheetGroup[];
}

export interface BalanceSheetReport {
  companyId: string;
  financialYearId: string;
  asOfDate: Date;

  assetGroups: BalanceSheetGroup[];
  liabilityGroups: BalanceSheetGroup[];
  equityGroups: BalanceSheetGroup[];

  totalAssets: MonetaryBalance;
  totalLiabilities: MonetaryBalance;
  totalEquity: MonetaryBalance;

  difference: MonetaryBalance;
  isBalanced: boolean;
}
