import { MonetaryBalance } from './index';

export interface GeneralLedgerEntry {
  entryId: string;
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  ledgerId: string;
  ledgerName: string;
  narration: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: MonetaryBalance;
}

export interface GeneralLedgerStatement {
  ledgerId: string;
  ledgerName: string;
  openingBalance: MonetaryBalance;
  closingBalance: MonetaryBalance;
  entries: GeneralLedgerEntry[];
}

export interface GeneralLedgerReport {
  companyId: string;
  financialYearId: string;
  startDate?: Date;
  endDate?: Date;
  statements: GeneralLedgerStatement[];
}
