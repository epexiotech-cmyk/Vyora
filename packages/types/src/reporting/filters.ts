export interface JournalQueryFilter {
  companyId: string;
  financialYearId: string;
  ledgerId?: string;
  startDate?: Date;
  endDate?: Date;
  voucherType?: string;
  searchQuery?: string;
  vouchersInvolvingLedgerId?: string;
}

export interface PaginationDto {
  limit?: number;
  offset?: number;
}
