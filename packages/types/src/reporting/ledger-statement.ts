import { MonetaryBalance } from './balances';

export interface JournalEntryRow {
  entryId: string;
  lineNumber?: number;
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: string;
  referenceType?: string;
  isCancelled?: boolean;
  ledgerId: string;
  ledgerName: string;
  debitAmount: number; // Paise
  creditAmount: number; // Paise
  narration: string | null;
  runningBalance?: MonetaryBalance;
}

export interface LedgerStatementReport {
  ledgerId: string;
  companyId: string;
  financialYearId: string;
  startDate?: Date;
  endDate?: Date;
  openingBalance: MonetaryBalance;
  closingBalance: MonetaryBalance;
  entries: JournalEntryRow[];
}
