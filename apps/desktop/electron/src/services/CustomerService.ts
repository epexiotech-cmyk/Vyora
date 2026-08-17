import {
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
} from '@vyora/types';

import { CustomerRepository, PaymentAccountRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';
import { partyLedgerIntegrationService } from './PartyLedgerIntegrationService';

export class CustomerService {
  private customerRepo = new CustomerRepository();
  private paymentAccountRepo = new PaymentAccountRepository();

  private async validatePaymentAccount(
    accountId: string | null | undefined,
    companyId: string,
    fieldName: string,
  ) {
    if (!accountId) return;

    const account = await this.paymentAccountRepo.getById(accountId);
    if (!account || account.companyId !== companyId) {
      throw new Error(`The provided ${fieldName} does not exist or belong to this company.`);
    }

    if (!account.isActive) {
      throw new Error(`The provided ${fieldName} must be an active payment account.`);
    }
  }

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

    await this.validatePaymentAccount(
      data.defaultPaymentAccountId,
      companyId,
      'defaultPaymentAccountId',
    );
    await this.validatePaymentAccount(data.defaultQrAccountId, companyId, 'defaultQrAccountId');

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

    await this.validatePaymentAccount(
      data.defaultPaymentAccountId,
      companyId,
      'defaultPaymentAccountId',
    );
    await this.validatePaymentAccount(data.defaultQrAccountId, companyId, 'defaultQrAccountId');

    return await this.customerRepo.update(id, companyId, data);
  }

  public async deactivateCustomer(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.customerRepo.deactivate(id, companyId);
  }
}

export const customerService = new CustomerService();
