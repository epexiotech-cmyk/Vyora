import { CreateTaxInput, TaxDto, UpdateTaxInput } from '@vyora/types';

import { TaxRepository } from '../repositories/TaxRepository';

import { companyContextService } from './CompanyContextService';

export class TaxService {
  private taxRepo = new TaxRepository();

  public async getAllTaxes(): Promise<TaxDto[]> {
    const activeCompanyId = companyContextService.getActiveCompany();
    if (!activeCompanyId) throw new Error('No active company selected');

    return this.taxRepo.findAllByCompany(activeCompanyId);
  }

  public async createTax(data: Omit<CreateTaxInput, 'companyId'>): Promise<TaxDto> {
    const activeCompanyId = companyContextService.getActiveCompany();
    if (!activeCompanyId) throw new Error('No active company selected');

    return this.taxRepo.create({
      ...data,
      companyId: activeCompanyId,
    });
  }

  public async updateTax(data: UpdateTaxInput): Promise<TaxDto> {
    return this.taxRepo.update(data);
  }
}

export const taxService = new TaxService();
