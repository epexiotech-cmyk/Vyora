import { describe, it, expect, vi, beforeEach } from 'vitest';

import { balanceComputationService } from '../../src/services/BalanceComputationService';
import { journalQueryService } from '../../src/services/JournalQueryService';
import { UpiBookService } from '../../src/services/UpiBookService';

vi.mock('../../src/services/JournalQueryService', () => ({
  journalQueryService: {
    getLedgerOpeningBalance: vi.fn(),
    getJournalEntries: vi.fn(),
  },
}));

vi.mock('../../src/services/BalanceComputationService', () => ({
  balanceComputationService: {
    computeAdjustedOpeningBalance: vi.fn(),
    calculateNetBalance: vi.fn(),
  },
}));

describe('UpiBookService', () => {
  let service: UpiBookService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UpiBookService();
  });

  it('should fetch and correctly process UPI book entries', async () => {
    vi.mocked(journalQueryService.getLedgerOpeningBalance).mockResolvedValue({
      openingBalance: 0,
      openingType: 'Dr',
    });

    vi.mocked(balanceComputationService.computeAdjustedOpeningBalance).mockReturnValue({
      amount: 0,
      type: 'Dr',
    });

    vi.mocked(journalQueryService.getJournalEntries).mockResolvedValue([
      {
        entryId: 'e1',
        voucherId: 'v1',
        voucherNumber: 'V-1',
        voucherDate: new Date('2026-08-01'),
        voucherType: 'Receipt',
        ledgerId: 'upi-ledger',
        debitAmount: 500,
        creditAmount: 0,
        narration: 'Payment received',
      } as never,
    ]);

    vi.mocked(balanceComputationService.calculateNetBalance).mockReturnValue({
      amount: 500,
      type: 'Dr',
    });

    const filter = {
      companyId: 'company-1',
      financialYearId: 'fy-1',
      ledgerId: 'upi-ledger',
      startDate: new Date('2026-08-01'),
    };

    const result = await service.getUpiBook(filter);

    expect(journalQueryService.getJournalEntries).toHaveBeenCalledTimes(2); // One for prior, one for period

    // Checks boundary isolation
    const strictPeriodCall = vi.mocked(journalQueryService.getJournalEntries).mock.calls[1][0];
    expect(strictPeriodCall.companyId).toBe('company-1');
    expect(strictPeriodCall.ledgerId).toBe('upi-ledger'); // Strict isolation to just the UPI account

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].balance).toBe(500);
    expect(result.closingBalance).toEqual({ amount: 500, type: 'DR' });
  });
});
