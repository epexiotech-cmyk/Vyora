import { CompanyProfileDto } from '@vyora/types';

export interface CompletionItem {
  key: string;
  label: string;
  completed: boolean;
  route?: string;
  weight: number;
}

export interface ProfileCompletionResult {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  items: CompletionItem[];
  nextRecommendedAction?: string;
}

export class CompanyCompletionService {
  /**
   * Calculates the completion percentage of a company profile.
   * Note: The financial year is inherently set during creation in the current architecture,
   * so it is passed as a boolean, defaulting to true if we have an active company.
   */
  public static calculateCompletion(
    profile: Partial<CompanyProfileDto>,
    hasFinancialYear: boolean = true,
  ): ProfileCompletionResult {
    const route = '/dashboard/settings/company-profile';

    const items: CompletionItem[] = [
      {
        key: 'legalName',
        label: 'Legal name',
        completed: !!profile.legalName?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'tradeName',
        label: 'Company name',
        completed: !!profile.tradeName?.trim() || !!profile.legalName?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'email',
        label: 'Email',
        completed: !!profile.email?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'phone',
        label: 'Phone',
        completed: !!profile.mobile?.trim() || !!profile.telephone?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'gstin',
        label: 'GSTIN',
        completed: !!profile.gstin?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'pan',
        label: 'PAN',
        completed: !!profile.pan?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'address',
        label: 'Address',
        completed: !!profile.addressLine1?.trim(),
        route,
        weight: 10,
      },
      {
        key: 'city',
        label: 'City',
        completed: !!profile.city?.trim(),
        route,
        weight: 5,
      },
      {
        key: 'state',
        label: 'State',
        completed: !!profile.stateCode?.trim(),
        route,
        weight: 5,
      },
      {
        key: 'country',
        label: 'Country',
        completed: !!profile.countryCode?.trim(),
        route,
        weight: 5,
      },
      {
        key: 'pincode',
        label: 'Pincode',
        completed: !!profile.pincode?.trim(),
        route,
        weight: 5,
      },
      {
        key: 'financialYear',
        label: 'Financial year',
        completed: hasFinancialYear,
        route: '/dashboard/settings/financial-years',
        weight: 5,
      },
      {
        key: 'logo',
        label: 'Logo',
        completed: !!profile.logoPath?.trim(),
        route,
        weight: 5,
      },
    ];

    let totalWeight = 0;
    let completedWeight = 0;
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    for (const item of items) {
      totalWeight += item.weight;
      if (item.completed) {
        completedWeight += item.weight;
        completedFields.push(item.key);
      } else {
        missingFields.push(item.key);
      }
    }

    const percentage = Math.round((completedWeight / totalWeight) * 100);

    // Sort items so missing ones with higher weight come first for recommendation
    const nextRecommendedAction =
      items.filter((i) => !i.completed).sort((a, b) => b.weight - a.weight)[0]?.key || undefined;

    return {
      percentage,
      completedFields,
      missingFields,
      items,
      nextRecommendedAction,
    };
  }
}
