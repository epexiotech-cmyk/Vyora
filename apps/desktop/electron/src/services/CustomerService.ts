import {
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
} from '@vyora/types';

import { CustomerRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';
import { partyLedgerIntegrationService } from './PartyLedgerIntegrationService';

export class CustomerService {
  private customerRepo = new CustomerRepository();

  public async searchCustomers(options: SearchCustomersOptions): Promise<CustomerListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.customerRepo.search(companyId, options);
  }

  public async getCustomerById(id: string): Promise<CustomerProfileDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.customerRepo.getById(id, companyId);
  }

  public async createCustomer(data: CreateCustomerInput): Promise<CustomerProfileDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return this.customerRepo.transaction((tx) => {
      const customerCode = this.customerRepo.getNextCustomerCodeSync(companyId, tx);

      const customer = this.customerRepo.createSync(
        companyId,
        {
          ...data,
          customerCode,
        },
        tx,
      );

      partyLedgerIntegrationService.createCustomerLedgerSync(companyId, customer, tx);

      return customer;
    });
  }

  public async updateCustomer(id: string, data: UpdateCustomerInput): Promise<CustomerProfileDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.customerRepo.update(id, companyId, data);
  }

  public async deactivateCustomer(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.customerRepo.deactivate(id, companyId);
  }
}

export const customerService = new CustomerService();
