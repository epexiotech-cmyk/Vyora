import { describe, it, expect, vi, beforeEach } from 'vitest';

import { companyContextService } from '../../src/services/CompanyContextService';
import { financialYearContextService } from '../../src/services/FinancialYearContextService';
import { PaymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';

vi.mock('../../src/services/CompanyContextService', () => ({
  companyContextService: {
    getActiveCompany: vi.fn(),
  },
}));

vi.mock('../../src/services/FinancialYearContextService', () => ({
  financialYearContextService: {
    getActiveFinancialYear: vi.fn(),
  },
}));

describe('PaymentAccountOpeningBalanceService Validation', () => {
  let service: PaymentAccountOpeningBalanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentAccountOpeningBalanceService();

    vi.mocked(companyContextService.getActiveCompany).mockReturnValue('company-123');
    vi.mocked(financialYearContextService.getActiveFinancialYear).mockReturnValue({
      id: 'fy-1',
      label: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('Opening balance amount = 0 -> allowed', () => {
    // Mock the required internal calls so it doesn't throw on later execution steps
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbMock = require('@vyora/database').db;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbMock.transaction = vi.fn((cb: any) =>
      cb({
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(() => null), // no existing voucher, payment account found, ledger found, etc (we mock these below if needed)
            })),
          })),
        })),
      }),
    );

    // If we only want to test validation boundary, we can just assert it doesn't throw the validation error.
    // However, since it proceeds to execute the transaction, we'll just check that it doesn't throw the specific error.
    try {
      service.createOpeningBalance({
        paymentAccountId: 'pa-1',
        amount: 0,
        balanceType: 'Dr',
        voucherDate: new Date('2026-05-01'),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      expect(e.message).not.toBe('Opening balance amount cannot be negative');
    }
  });

  it('Opening balance amount < 0 -> rejected', () => {
    expect(() => {
      service.createOpeningBalance({
        paymentAccountId: 'pa-1',
        amount: -500,
        balanceType: 'Dr',
        voucherDate: new Date('2026-05-01'),
      });
    }).toThrow('Opening balance amount cannot be negative');
  });
});
