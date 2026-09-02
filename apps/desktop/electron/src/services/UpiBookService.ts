import { UpiBookReportDto, UpiBookVoucherDto, JournalQueryFilter } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';

export class UpiBookService {
  public async getUpiBook(
    filter: JournalQueryFilter & { ledgerId: string },
  ): Promise<UpiBookReportDto> {
    const { companyId, financialYearId, ledgerId, startDate, endDate, voucherType, searchQuery } =
      filter;

    // 1. Fetch native opening balance for the upi ledger
    const { openingBalance, openingType } =
      await journalQueryService.getLedgerOpeningBalance(ledgerId);

    let adjustedOpeningBalance = { amount: openingBalance, type: openingType };

    // 2. Adjust opening balance if startDate is provided
    if (startDate) {
      const priorFilter: JournalQueryFilter = {
        companyId,
        financialYearId,
        ledgerId, // Strict ledgerId filter to ONLY get upi movements
        endDate: new Date(startDate.getTime() - 1),
      };
      const priorEntries = await journalQueryService.getJournalEntries(priorFilter);

      adjustedOpeningBalance = balanceComputationService.computeAdjustedOpeningBalance(
        openingBalance,
        openingType,
        priorEntries,
      );
    }

    // 3. Query all voucher entries for the requested period involving the upi ledger
    const periodFilter: JournalQueryFilter = {
      companyId,
      financialYearId,
      startDate,
      endDate,
      voucherType,
      searchQuery,
      // Here we filter by voucher entries containing this ledger,
      // but we want to return the opposite leg (the "Party" / offset account).
      // Note: The UI might prefer to see the *other* ledger name.
      vouchersInvolvingLedgerId: ledgerId,
    };

    // But wait, the standard JournalQueryService.getJournalEntries will return entries for ALL ledgers involved
    // in the vouchers. We actually ONLY want the entries for THIS ledgerId to compute running balances,
    // OR we want the full voucher details to extract the opposite leg.
    // Given the current architecture, CashBookService filters by `ledgerId: ledgerId` directly.
    const strictPeriodFilter: JournalQueryFilter = {
      ...periodFilter,
      ledgerId, // Only get the entries FOR this upi account
    };

    const entries = await journalQueryService.getJournalEntries(strictPeriodFilter);

    // 4. Compute running balances
    let currentBalance = adjustedOpeningBalance.amount;
    let currentType = adjustedOpeningBalance.type;
    let totalDebit = 0;
    let totalCredit = 0;

    const mappedEntries: UpiBookVoucherDto[] = entries.map((entry) => {
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;

      const balance = balanceComputationService.calculateNetBalance(
        currentBalance,
        currentType as 'Dr' | 'Cr',
        entry.debitAmount,
        entry.creditAmount,
      );

      currentBalance = balance.amount;
      currentType = balance.type;

      return {
        journalEntryId: entry.entryId,
        voucherId: entry.voucherId,
        voucherNumber: entry.voucherNumber,
        voucherDate: entry.voucherDate,
        voucherType: entry.voucherType as UpiBookVoucherDto['voucherType'],
        referenceType: entry.referenceType as UpiBookVoucherDto['referenceType'],
        narration: entry.narration || undefined,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        balance: currentBalance,
        balanceType: currentType === 'Dr' ? 'DR' : 'CR',
        isCancelled: !!entry.isCancelled, // Updated to use the actual isCancelled flag from the entry
        createdAt: entry.voucherDate, // Assuming voucherDate for now, normally we'd pull createdAt if available.
      };
    });

    return {
      companyId,
      financialYearId,
      ledgerId,
      accountId: '', // The IPC handler will provide this from PaymentAccount table
      accountName: '', // The IPC handler will provide this
      period: {
        startDate,
        endDate,
      },
      openingBalance: {
        amount: adjustedOpeningBalance.amount,
        type:
          adjustedOpeningBalance.amount === 0
            ? 'ZERO'
            : adjustedOpeningBalance.type === 'Dr'
              ? 'DR'
              : 'CR',
      },
      closingBalance: {
        amount: currentBalance,
        type: currentBalance === 0 ? 'ZERO' : currentType === 'Dr' ? 'DR' : 'CR',
      },
      totalDebit,
      totalCredit,
      entries: mappedEntries,
    };
  }
}

export const upiBookService = new UpiBookService();
