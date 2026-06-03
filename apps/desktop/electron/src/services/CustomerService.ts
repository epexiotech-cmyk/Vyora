import { Customer, InsertCustomer } from '@vyora/types';

import { CustomerRepository } from '../repositories';

export class CustomerService {
  private customerRepo = new CustomerRepository();

  public async getAllCustomers(): Promise<Customer[]> {
    return await this.customerRepo.getAll();
  }

  public async createCustomer(data: Omit<InsertCustomer, 'id' | 'createdAt'>): Promise<Customer> {
    return await this.customerRepo.create(data);
  }
}

export const customerService = new CustomerService();
