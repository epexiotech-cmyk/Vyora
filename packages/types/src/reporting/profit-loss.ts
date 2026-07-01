import { MonetaryBalance } from './balances';

export interface ProfitLossRow {
  ledgerId: string;
  ledgerName: string;
  groupId: string;
  balance: MonetaryBalance;
}

export interface ProfitLossGroup {
  groupId: string;
  groupName: string;
  parentGroupId: string | null;
  nature: 'Income' | 'Expense';
  totalBalance: MonetaryBalance;
  ledgers: ProfitLossRow[];
  subGroups: ProfitLossGroup[];
}

export interface ProfitLossReport {
  companyId: string;
  financialYearId: string;
  asOfDate: Date;
  incomeGroups: ProfitLossGroup[];
  expenseGroups: ProfitLossGroup[];
  totalIncome: MonetaryBalance;
  totalExpense: MonetaryBalance;
  netResult: MonetaryBalance;
  isProfit: boolean;
}
