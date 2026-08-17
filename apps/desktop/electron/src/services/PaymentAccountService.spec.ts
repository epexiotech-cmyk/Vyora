import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => ''),
    isPackaged: false,
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
}));

import { ChartOfAccountsRepository } from '../../src/repositories/ChartOfAccountsRepository';
import { companyContextService } from '../../src/services/CompanyContextService';
import { paymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';
import {
  PaymentAccountService,
  PaymentAccountDeletionError,
} from '../../src/services/PaymentAccountService';

vi.mock('@vyora/database', () => {
  return {
    db: {
      transaction: vi.fn(async (cb) =>
        cb({
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                get: vi.fn(() => null),
                all: vi.fn(() => []),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn(),
          })),
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(),
            })),
          })),
          delete: vi.fn(() => ({
            where: vi.fn(),
          })),
        }),
      ),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: vi.fn(() => null),
            all: vi.fn(() => []),
          })),
        })),
      })),
    },
    payment_accounts: {},
    ledgers: {},
    ledger_groups: {},
  };
});

vi.mock('../../src/services/CompanyContextService', () => ({
  companyContextService: {
    getActiveCompany: vi.fn(() => 'company-123'),
  },
}));

describe('PaymentAccountService', () => {
  let service: PaymentAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentAccountService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if no company is active', async () => {
    vi.mocked(companyContextService.getActiveCompany).mockReturnValueOnce(null);
    await expect(
      service.create({ accountType: 'CASH', displayName: 'Cash', displayOrder: 0 }),
    ).rejects.toThrow('No active company selected');
  });
});

vi.mock('../../src/services/PaymentAccountOpeningBalanceService', () => ({
  paymentAccountOpeningBalanceService: {
    hasActiveOpeningBalance: vi.fn(),
    reverseOpeningBalance: vi.fn(),
  },
}));

describe('PaymentAccountService.delete() Orchestration', () => {
  let service: PaymentAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentAccountService();
    vi.mocked(companyContextService.getActiveCompany).mockReturnValue('company-123');

    // Mock the DB to return an existing payment account
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbMock = require('@vyora/database').db;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbMock.transaction.mockImplementation((cb: any) => {
      const txMock = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(() => ({ id: 'pa-1', companyId: 'company-123', ledgerId: 'ledger-1' })),
            })),
          })),
        })),
        delete: vi.fn(() => ({ where: vi.fn(() => ({ run: vi.fn() })) })),
      };
      return cb(txMock);
    });

    // Mock COA repository methods
    ChartOfAccountsRepository.prototype.getLedgerById = vi.fn().mockReturnValue({ id: 'ledger-1' });
    ChartOfAccountsRepository.prototype.deactivateLedger = vi.fn();
  });

  it('Delete payment account with no history -> account deleted, ledger deactivated', () => {
    ChartOfAccountsRepository.prototype.getTransactionCounts = vi.fn().mockReturnValue({
      journalCount: 0,
      voucherCount: 0,
      nonOpeningCount: 0,
    });
    vi.mocked(paymentAccountOpeningBalanceService.hasActiveOpeningBalance).mockReturnValue(false);

    service.delete('pa-1');

    expect(ChartOfAccountsRepository.prototype.deactivateLedger).toHaveBeenCalledWith(
      'ledger-1',
      'company-123',
      expect.anything(),
    );
    expect(paymentAccountOpeningBalanceService.reverseOpeningBalance).not.toHaveBeenCalled();
  });

  it('Delete payment account with an opening balance -> opening balance reversed, account deleted, ledger deactivated', () => {
    ChartOfAccountsRepository.prototype.getTransactionCounts = vi.fn().mockReturnValue({
      journalCount: 1,
      voucherCount: 0,
      nonOpeningCount: 0,
    });
    vi.mocked(paymentAccountOpeningBalanceService.hasActiveOpeningBalance).mockReturnValue(true);

    service.delete('pa-1');

    expect(paymentAccountOpeningBalanceService.reverseOpeningBalance).toHaveBeenCalledWith(
      'pa-1',
      expect.anything(),
    );
    expect(ChartOfAccountsRepository.prototype.deactivateLedger).toHaveBeenCalledWith(
      'ledger-1',
      'company-123',
      expect.anything(),
    );
  });

  it('Delete payment account with normal journal history -> PaymentAccountDeletionError', () => {
    ChartOfAccountsRepository.prototype.getTransactionCounts = vi.fn().mockReturnValue({
      journalCount: 2,
      voucherCount: 0,
      nonOpeningCount: 1,
    });

    expect(() => service.delete('pa-1')).toThrow(PaymentAccountDeletionError);
    expect(paymentAccountOpeningBalanceService.reverseOpeningBalance).not.toHaveBeenCalled();
    expect(ChartOfAccountsRepository.prototype.deactivateLedger).not.toHaveBeenCalled();
  });

  it('Atomic failure scenario (reverseOpeningBalance throws) rolls back the operation', () => {
    ChartOfAccountsRepository.prototype.getTransactionCounts = vi.fn().mockReturnValue({
      journalCount: 1,
      voucherCount: 0,
      nonOpeningCount: 0,
    });
    vi.mocked(paymentAccountOpeningBalanceService.hasActiveOpeningBalance).mockReturnValue(true);

    vi.mocked(paymentAccountOpeningBalanceService.reverseOpeningBalance).mockImplementation(() => {
      throw new Error('Database connection failed during reversal');
    });

    expect(() => service.delete('pa-1')).toThrow('Database connection failed during reversal');

    // In our simplified mock, tx.delete is just a mock object property, but we can verify that the transaction logic bubbles the error
    expect(ChartOfAccountsRepository.prototype.deactivateLedger).not.toHaveBeenCalled();
  });
});
