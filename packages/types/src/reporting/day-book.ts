import { JournalEntryRow } from './ledger-statement';

export interface DayBookVoucherDto {
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  entries: JournalEntryRow[];
}

export interface DayBookReportDto {
  companyId: string;
  financialYearId: string;
  startDate?: Date;
  endDate?: Date;
  vouchers: DayBookVoucherDto[];
}
