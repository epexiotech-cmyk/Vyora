export interface TransferRegisterEntryDto {
  journalEntryId: string;
  voucherId: string;
  voucherNumber: string;
  transferDate: Date;

  sourceLedgerId: string;
  sourceAccountName: string;

  destinationLedgerId: string;
  destinationAccountName: string;

  amount: number;
  narration?: string;
  isCancelled: boolean;
  createdAt: Date;
}

export interface TransferRegisterReportDto {
  companyId: string;
  financialYearId: string;

  period: {
    startDate?: Date;
    endDate?: Date;
  };

  totalTransferAmount: number;

  entries: TransferRegisterEntryDto[];
}
