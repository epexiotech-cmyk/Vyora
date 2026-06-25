import { MonetaryBalance } from './balances';

export interface TrialBalanceRow {
  ledgerId: string;
  ledgerName: string;
  groupId: string;
  closingBalance: MonetaryBalance;
}

export interface TrialBalanceGroup {
  groupId: string;
  groupName: string;
  parentGroupId: string | null;
  nature: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  totalBalance: MonetaryBalance;
  ledgers: TrialBalanceRow[];
  subGroups: TrialBalanceGroup[];
}

export interface TrialBalanceReport {
  companyId: string;
  financialYearId: string;
  asOfDate: Date;
  groups: TrialBalanceGroup[];
  grandTotalDebit: number;
  grandTotalCredit: number;
  isBalanced: boolean;
}
