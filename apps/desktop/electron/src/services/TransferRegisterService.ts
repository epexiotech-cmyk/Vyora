import { TransferRegisterReportDto, TransferRegisterEntryDto } from '@vyora/types';

import { journalQueryService } from './JournalQueryService';

export class TransferRegisterService {
  public async getTransferRegister(
    companyId: string,
    financialYearId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TransferRegisterReportDto> {
    const rawEntries = await journalQueryService.getTransferRegisterEntries(
      companyId,
      financialYearId,
      startDate,
      endDate,
    );

    // Group entries by voucherId
    const vouchersMap = new Map<string, (typeof rawEntries)[number][]>();
    for (const row of rawEntries) {
      if (!vouchersMap.has(row.voucherId)) {
        vouchersMap.set(row.voucherId, []);
      }
      vouchersMap.get(row.voucherId)!.push(row);
    }

    let totalTransferAmount = 0;
    const entries: TransferRegisterEntryDto[] = [];

    for (const [voucherId, rows] of vouchersMap.entries()) {
      // A valid fund transfer voucher should have 2 entries: one debit, one credit
      // The credit entry is the source (money leaving)
      // The debit entry is the destination (money arriving)
      const creditRow = rows.find((r) => r.creditAmount > 0);
      const debitRow = rows.find((r) => r.debitAmount > 0);

      if (creditRow && debitRow) {
        // Technically both amounts should be the same.
        totalTransferAmount += creditRow.creditAmount;

        entries.push({
          journalEntryId: creditRow.entryId, // Just picking one as reference
          voucherId: voucherId,
          voucherNumber: creditRow.voucherNumber,
          transferDate: creditRow.voucherDate,
          sourceLedgerId: creditRow.ledgerId,
          sourceAccountName: creditRow.ledgerName,
          destinationLedgerId: debitRow.ledgerId,
          destinationAccountName: debitRow.ledgerName,
          amount: creditRow.creditAmount,
          narration: creditRow.narration || undefined, // Usually narration on both sides is descriptive
          isCancelled: creditRow.isCancelled,
          createdAt: creditRow.createdAt,
        });
      }
    }

    return {
      companyId,
      financialYearId,
      period: {
        startDate,
        endDate,
      },
      totalTransferAmount,
      entries,
    };
  }
}

export const transferRegisterService = new TransferRegisterService();
