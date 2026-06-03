import { CustomerDto, CreateCustomerInput } from '@vyora/types';

import { CustomerRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';

export class CustomerService {
  private customerRepo = new CustomerRepository();

  public async getAllCustomers(): Promise<CustomerDto[]> {
    return await this.customerRepo.getAll();
  }

  public async createCustomer(data: CreateCustomerInput): Promise<CustomerDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.customerRepo.create({
      companyId,
      name: data.name,
      gstin: data.gstin,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
      state: data.state,
      balance: data.balance || 0,
    });
  }
}

export const customerService = new CustomerService();
