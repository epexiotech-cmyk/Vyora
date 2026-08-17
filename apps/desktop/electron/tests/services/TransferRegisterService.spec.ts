import { describe, it, expect, vi, beforeEach } from 'vitest';

import { journalQueryService } from '../../src/services/JournalQueryService';
import { TransferRegisterService } from '../../src/services/TransferRegisterService';

vi.mock('../../src/services/JournalQueryService', () => ({
  journalQueryService: {
    getTransferRegisterEntries: vi.fn(),
  },
}));

describe('TransferRegisterService', () => {
  let service: TransferRegisterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransferRegisterService();
  });

  it('should extract correct source and destination from contra fund transfers', async () => {
    vi.mocked(journalQueryService.getTransferRegisterEntries).mockResolvedValue([
      {
        voucherId: 'v1',
        voucherNumber: 'C-01',
        voucherDate: new Date('2026-08-01'),
        ledgerId: 'led-1',
        ledgerName: 'Bank A',
        debitAmount: 0,
        creditAmount: 500,
        narration: 'T1',
      } as never,
      {
        voucherId: 'v1',
        voucherNumber: 'C-01',
        voucherDate: new Date('2026-08-01'),
        ledgerId: 'led-2',
        ledgerName: 'Bank B',
        debitAmount: 500,
        creditAmount: 0,
        narration: 'T2',
      } as never,
    ]);

    const result = await service.getTransferRegister('company-1', 'fy-1');

    expect(journalQueryService.getTransferRegisterEntries).toHaveBeenCalledWith(
      'company-1',
      'fy-1',
      undefined,
      undefined,
    );

    expect(result.entries).toHaveLength(1);
    expect(result.totalTransferAmount).toBe(500);

    const entry = result.entries[0];
    expect(entry.sourceAccountName).toBe('Bank A'); // Credit side is source
    expect(entry.destinationAccountName).toBe('Bank B'); // Debit side is destination
    expect(entry.amount).toBe(500);
  });
});
