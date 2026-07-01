// Phase 4.4B Foundation DTO

export interface CompanyProfileDto {
  id: string;
  legalName: string;
  tradeName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  constitutionType?: string | null;
  businessType?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  stateCode?: string | null;
  gstStateId?: string | null;
  countryCode?: string | null;
  pincode?: string | null;
  email?: string | null;
  mobile?: string | null;
  telephone?: string | null;
  website?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateCompanyProfileRequest {
  legalName: string;
  isGstRegistered: boolean;
  gstin?: string | null;
  financialYearStart: Date;
  currency: string;
}

export interface UpdateCompanyProfileRequest {
  legalName?: string;
  tradeName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  constitutionType?: string | null;
  businessType?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  stateCode?: string | null;
  gstStateId?: string | null;
  countryCode?: string | null;
  pincode?: string | null;
  email?: string | null;
  mobile?: string | null;
  telephone?: string | null;
  website?: string | null;
}

// Backward compatibility for existing bootstrap code
export type CompanyDto = CompanyProfileDto;
export type CreateCompanyInput = CreateCompanyProfileRequest;
export type UpdateCompanyInput = UpdateCompanyProfileRequest;
