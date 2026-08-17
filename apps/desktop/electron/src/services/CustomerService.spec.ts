import { CreateCustomerInput } from '@vyora/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { customerService } from './CustomerService';

vi.mock('../repositories', () => {
  return {
    CustomerRepository: class {
      getNextCustomerCodeSync = vi.fn().mockReturnValue('CUST-001');
      createSync = vi.fn().mockReturnValue({ id: 'cust-1' });
      transaction = vi.fn().mockImplementation((cb) => cb({}));
      update = vi.fn().mockResolvedValue({ id: 'cust-1' });
    },
    PaymentAccountRepository: class {
      getById = vi.fn();
    },
  };
});

vi.mock('./CompanyContextService', () => ({
  companyContextService: {
    getActiveCompany: vi.fn().mockReturnValue('comp-1'),
  },
}));

vi.mock('./PartyLedgerIntegrationService', () => ({
  partyLedgerIntegrationService: {
    createCustomerLedgerSync: vi.fn(),
  },
}));

describe('CustomerService', () => {
  let paymentAccountRepo: { getById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    paymentAccountRepo = (
      customerService as unknown as { paymentAccountRepo: typeof paymentAccountRepo }
    ).paymentAccountRepo;
  });

  describe('Accounting Phase 5 Validation', () => {
    const validData: CreateCustomerInput = {
      name: 'Test Customer',
      creditDays: 0,
      creditLimit: 0,
      isActive: true,
      openingBalance: 0,
    };

    it('should successfully create customer with valid payment account mappings', async () => {
      paymentAccountRepo.getById.mockResolvedValue({
        id: 'pa-1',
        isActive: true,
        companyId: 'comp-1',
      });

      await expect(
        customerService.createCustomer({
          ...validData,
          defaultPaymentAccountId: 'pa-1',
          defaultQrAccountId: 'pa-1',
        }),
      ).resolves.toBeDefined();
    });

    it('should throw error if payment account does not exist', async () => {
      paymentAccountRepo.getById.mockResolvedValue(null);

      await expect(
        customerService.createCustomer({
          ...validData,
          defaultPaymentAccountId: 'invalid-id',
        }),
      ).rejects.toThrow(
        'The provided defaultPaymentAccountId does not exist or belong to this company.',
      );
    });

    it('should throw error if payment account is inactive', async () => {
      paymentAccountRepo.getById.mockResolvedValue({
        id: 'pa-2',
        isActive: false,
        companyId: 'comp-1',
      });

      await expect(
        customerService.createCustomer({
          ...validData,
          defaultQrAccountId: 'pa-2',
        }),
      ).rejects.toThrow('The provided defaultQrAccountId must be an active payment account.');
    });
  });
});
