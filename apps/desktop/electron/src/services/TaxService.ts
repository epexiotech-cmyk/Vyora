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
    if (data.isActive === false) {
      const activeCompanyId = companyContextService.getActiveCompany();
      if (!activeCompanyId) throw new Error('No active company selected');

      const { ProductRepository } = await import('../repositories/ProductRepository');
      const productRepo = new ProductRepository();
      const hasProducts = await productRepo.hasProductsWithTax(data.id, activeCompanyId);
      if (hasProducts) {
        throw new Error('Cannot deactivate tax: It is currently used by one or more products.');
      }
    }
    return this.taxRepo.update(data);
  }
}

export const taxService = new TaxService();
