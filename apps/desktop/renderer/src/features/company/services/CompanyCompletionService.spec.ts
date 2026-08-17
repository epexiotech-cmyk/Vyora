import { CompanyProfileDto } from '@vyora/types';
import { describe, it, expect } from 'vitest';

import { CompanyCompletionService } from './CompanyCompletionService';

describe('CompanyCompletionService', () => {
  it('should calculate 0% for an empty profile without financial year', () => {
    const profile: Partial<CompanyProfileDto> = {};
    const result = CompanyCompletionService.calculateCompletion(profile, false);

    expect(result.percentage).toBe(0);
    expect(result.completedFields).toHaveLength(0);
    expect(result.missingFields).toContain('legalName');
    expect(result.missingFields).toContain('financialYear');
  });

  it('should correctly calculate completion with partial data', () => {
    const profile: Partial<CompanyProfileDto> = {
      legalName: 'Vyora Tech',
      email: 'hello@vyora.com',
      mobile: '1234567890',
    };
    // Weights: legalName (10), email (10), phone (10), financialYear (5 by default) = 35%
    const result = CompanyCompletionService.calculateCompletion(profile, true);

    expect(result.percentage).toBe(35);
    expect(result.completedFields).toContain('legalName');
    expect(result.completedFields).toContain('email');
    expect(result.completedFields).toContain('phone');
    expect(result.completedFields).toContain('financialYear');
    expect(result.missingFields).toContain('gstin');
    expect(result.missingFields).toContain('logo');
  });

  it('should calculate 100% for a fully complete profile', () => {
    const profile: Partial<CompanyProfileDto> = {
      legalName: 'Vyora Tech',
      tradeName: 'Vyora',
      email: 'hello@vyora.com',
      mobile: '1234567890',
      gstin: '22AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      addressLine1: '123 Tech Park',
      city: 'Pune',
      stateCode: '27',
      countryCode: 'IN',
      pincode: '411001',
      logoPath: '/attachments/companies/123/logo.png',
    };
    const result = CompanyCompletionService.calculateCompletion(profile, true);

    expect(result.percentage).toBe(100);
    expect(result.missingFields).toHaveLength(0);
  });

  it('should resolve phone correctly if telephone is provided but not mobile', () => {
    const profile: Partial<CompanyProfileDto> = {
      telephone: '022-1234567',
    };
    const result = CompanyCompletionService.calculateCompletion(profile, false);

    // Only phone (10) completed out of 100
    expect(result.percentage).toBe(10);
    expect(result.completedFields).toContain('phone');
  });

  it('should assign correct routes to items', () => {
    const profile: Partial<CompanyProfileDto> = {};
    const result = CompanyCompletionService.calculateCompletion(profile, false);

    const logoItem = result.items.find((i) => i.key === 'logo');
    expect(logoItem?.route).toBe('/dashboard/settings/company-profile');

    const finYearItem = result.items.find((i) => i.key === 'financialYear');
    expect(finYearItem?.route).toBe('/dashboard/settings/financial-years');
  });
});
