import { MonetaryBalance } from './balances';
import { JournalEntryRow } from './ledger-statement';

export interface CashBookVoucherDto {
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  referenceType?: string;
  isCancelled?: boolean;
  entries: JournalEntryRow[];
  runningBalance: MonetaryBalance;
}

export interface CashBookReportDto {
  companyId: string;
  financialYearId: string;
  ledgerId: string;
  startDate?: Date;
  endDate?: Date;
  openingBalance: MonetaryBalance;
  closingBalance: MonetaryBalance;
  vouchers: CashBookVoucherDto[];
}
