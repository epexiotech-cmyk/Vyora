export interface FinancialYearDto {
  id: string;
  companyId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface CreateFinancialYearInput {
  companyId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}
