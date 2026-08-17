import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paymentAccountRepository } from '../../src/repositories/PaymentAccountRepository';
import { AccountBalanceSummaryService } from '../../src/services/AccountBalanceSummaryService';
import { journalQueryService } from '../../src/services/JournalQueryService';

vi.mock('../../src/repositories/PaymentAccountRepository', () => ({
  paymentAccountRepository: {
    getByCompany: vi.fn(),
  },
}));

vi.mock('../../src/services/JournalQueryService', () => ({
  journalQueryService: {
    getBulkLedgerMovements: vi.fn(),
  },
}));

describe('AccountBalanceSummaryService', () => {
  let service: AccountBalanceSummaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountBalanceSummaryService();
  });

  it('should fetch bulk movements exactly once to prevent N+1 queries', async () => {
    vi.mocked(paymentAccountRepository.getByCompany).mockResolvedValue([
      {
        id: 'acc-1',
        displayName: 'Bank A',
        accountType: 'BANK',
        ledgerId: 'led-1',
        isActive: true,
      },
      { id: 'acc-2', displayName: 'Cash', accountType: 'CASH', ledgerId: 'led-2', isActive: true },
      { id: 'acc-3', displayName: 'UPI', accountType: 'UPI', ledgerId: 'led-3', isActive: true },
    ] as never[]);

    vi.mocked(journalQueryService.getBulkLedgerMovements).mockResolvedValue([
      {
        ledgerId: 'led-1',
        ledgerName: 'Bank A',
        groupId: 'g1',
        openingBalance: 1000,
        openingType: 'Dr',
        totalDebit: 500,
        totalCredit: 200,
      },
      {
        ledgerId: 'led-2',
        ledgerName: 'Cash',
        groupId: 'g1',
        openingBalance: 500,
        openingType: 'Dr',
        totalDebit: 100,
        totalCredit: 600,
      }, // Balance becomes 0
      {
        ledgerId: 'led-3',
        ledgerName: 'UPI',
        groupId: 'g1',
        openingBalance: 0,
        openingType: 'Cr',
        totalDebit: 300,
        totalCredit: 100,
      },
    ]);

    const result = await service.getAccountBalanceSummary('company-1', 'fy-1');

    expect(paymentAccountRepository.getByCompany).toHaveBeenCalledTimes(1);
    expect(paymentAccountRepository.getByCompany).toHaveBeenCalledWith('company-1');

    // VERIFY BULK FETCH WAS CALLED EXACTLY ONCE
    expect(journalQueryService.getBulkLedgerMovements).toHaveBeenCalledTimes(1);
    expect(journalQueryService.getBulkLedgerMovements).toHaveBeenCalledWith(
      'company-1',
      'fy-1',
      undefined,
      false,
    );

    expect(result.accounts).toHaveLength(3);

    const bank = result.accounts.find((a) => a.accountId === 'acc-1')!;
    expect(bank.closingBalance).toEqual({ amount: 1300, type: 'DR' }); // 1000 (Dr) + 500 (Dr) - 200 (Cr) = 1300 (Dr)

    const cash = result.accounts.find((a) => a.accountId === 'acc-2')!;
    expect(cash.closingBalance).toEqual({ amount: 0, type: 'ZERO' }); // 500 (Dr) + 100 (Dr) - 600 (Cr) = 0

    const upi = result.accounts.find((a) => a.accountId === 'acc-3')!;
    expect(upi.closingBalance).toEqual({ amount: 200, type: 'DR' }); // 0 (Cr) + 300 (Dr) - 100 (Cr) = 200 (Dr)
  });
});
