export interface UpiBookVoucherDto {
  journalEntryId: string;
  voucherId: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: (typeof import('../accounting').VoucherTypeEnum)[number];
  referenceType?: (typeof import('../accounting').VoucherReferenceTypeEnum)[number];
  referenceId?: string;
  narration?: string;

  debitAmount: number;
  creditAmount: number;
  balance: number;
  balanceType: 'DR' | 'CR' | 'ZERO';

  partyName?: string;
  isCancelled: boolean;
  createdAt: Date;
}

export interface UpiBookReportDto {
  companyId: string;
  financialYearId: string;
  ledgerId: string;
  accountId: string;
  accountName: string;
  upiId?: string;

  period: {
    startDate?: Date;
    endDate?: Date;
  };

  openingBalance: {
    amount: number;
    type: 'DR' | 'CR' | 'ZERO';
  };

  closingBalance: {
    amount: number;
    type: 'DR' | 'CR' | 'ZERO';
  };

  totalDebit: number;
  totalCredit: number;

  entries: UpiBookVoucherDto[];
}
