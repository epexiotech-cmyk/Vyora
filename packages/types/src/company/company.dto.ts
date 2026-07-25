import { z } from 'zod';

// Phase 4.4B Foundation DTO

export const currencyValidationSchema = z
  .string()
  .min(1, 'Currency is required')
  .length(3, 'Currency code must be exactly 3 characters')
  .toUpperCase();

export interface CurrencyMeta {
  currencyCode: string;
  currencyName: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
  symbolPosition: 'PREFIX' | 'SUFFIX';
}

export interface CompanyContextDto {
  company: CompanyProfileDto;
  currency: CurrencyMeta;
}

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

export const CreateCompanyProfileRequestSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
  isGstRegistered: z.boolean(),
  gstin: z.string().nullable().optional(),
  financialYearStart: z.date(),
  currency: z.string(),
});

export type CreateCompanyProfileRequest = z.infer<typeof CreateCompanyProfileRequestSchema>;

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
  currency?: string;
}

// Backward compatibility for existing bootstrap code
export type CompanyDto = CompanyProfileDto;
export const CreateCompanyInputSchema = CreateCompanyProfileRequestSchema;
export type CreateCompanyInput = CreateCompanyProfileRequest;
export type UpdateCompanyInput = UpdateCompanyProfileRequest;
