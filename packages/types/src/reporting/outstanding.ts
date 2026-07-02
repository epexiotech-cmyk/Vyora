import { MonetaryBalance } from './balances';

export interface OutstandingSummaryRowDto {
  ledgerId: string;
  ledgerName: string;
  closingBalance: MonetaryBalance;
}

export interface OutstandingSummaryDto {
  companyId: string;
  financialYearId: string;
  reportType: 'CUSTOMER' | 'SUPPLIER';
  asOfDate?: Date;
  rows: OutstandingSummaryRowDto[];
  totalBalance: MonetaryBalance;
}

export interface OutstandingAgeingRowDto extends OutstandingSummaryRowDto {
  current: MonetaryBalance;
  days30: MonetaryBalance;
  days60: MonetaryBalance;
  days90: MonetaryBalance;
  days90Plus: MonetaryBalance;
}
