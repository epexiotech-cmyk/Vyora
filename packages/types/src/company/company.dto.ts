// Phase 4.4B Foundation DTO

export interface CompanyDto {
  id: string;
  name: string;
  gstin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyInput {
  name: string;
  isGstRegistered: boolean;
  gstin?: string | null;
  financialYearStart: Date;
  currency: string;
}

export interface UpdateCompanyInput {
  id: string;
  name?: string;
  gstin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}
