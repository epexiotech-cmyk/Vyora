import { MonetaryBalance } from './balances';
import { JournalEntryRow } from './ledger-statement';

export interface BankBookVoucherDto {
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  entries: JournalEntryRow[];
  runningBalance: MonetaryBalance;
}

export interface BankBookReportDto {
  companyId: string;
  financialYearId: string;
  ledgerId: string;
  startDate?: Date;
  endDate?: Date;
  openingBalance: MonetaryBalance;
  closingBalance: MonetaryBalance;
  vouchers: BankBookVoucherDto[];
}
