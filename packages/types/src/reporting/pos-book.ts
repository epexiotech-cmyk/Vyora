import { MonetaryBalance } from './balances';
import { JournalEntryRow } from './ledger-statement';

export interface PosBookVoucherDto {
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  referenceType?: string;
  isCancelled?: boolean;
  entries: JournalEntryRow[];
  runningBalance: MonetaryBalance;
}

export interface PosBookReportDto {
  companyId: string;
  financialYearId: string;
  ledgerId: string;
  startDate?: Date;
  endDate?: Date;
  openingBalance: MonetaryBalance;
  closingBalance: MonetaryBalance;
  vouchers: PosBookVoucherDto[];
}
