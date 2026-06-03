import { Customer, InsertCustomer } from '@vyora/types';

import { CustomerRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';

export class CustomerService {
  private customerRepo = new CustomerRepository();

  public async getAllCustomers(): Promise<Customer[]> {
    return await this.customerRepo.getAll();
  }

  public async createCustomer(
    data: Omit<InsertCustomer, 'id' | 'createdAt' | 'companyId'>,
  ): Promise<Customer> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.customerRepo.create({ ...data, companyId });
  }
}

export const customerService = new CustomerService();
