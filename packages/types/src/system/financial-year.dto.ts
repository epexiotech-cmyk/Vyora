export interface FinancialYearDto {
  id: string;
  companyId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface CreateFinancialYearInput {
  startDate: Date;
  endDate: Date;
  activateAfterCreate?: boolean;
}
