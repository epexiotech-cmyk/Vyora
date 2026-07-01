import { BankBookReportDto, BankBookVoucherDto, JournalQueryFilter } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';

export class BankBookService {
  public async getBankBook(
    filter: JournalQueryFilter & { ledgerId: string },
  ): Promise<BankBookReportDto> {
    const { companyId, financialYearId, ledgerId, startDate, endDate, voucherType, searchQuery } =
      filter;

    // 1. Fetch native opening balance for the bank ledger
    const { openingBalance, openingType } =
      await journalQueryService.getLedgerOpeningBalance(ledgerId);

    let adjustedOpeningBalance = { amount: openingBalance, type: openingType };

    // 2. Adjust opening balance if startDate is provided
    if (startDate) {
      const priorFilter: JournalQueryFilter = {
        companyId,
        financialYearId,
        ledgerId, // Strict ledgerId filter to ONLY get bank movements
        endDate: new Date(startDate.getTime() - 1),
      };
      const priorEntries = await journalQueryService.getJournalEntries(priorFilter);

      adjustedOpeningBalance = balanceComputationService.computeAdjustedOpeningBalance(
        openingBalance,
        openingType,
        priorEntries,
      );
    }

    // 3. Query all voucher entries for the requested period involving the bank ledger
    const periodFilter: JournalQueryFilter = {
      companyId,
      financialYearId,
      startDate,
      endDate,
      voucherType,
      searchQuery,
      vouchersInvolvingLedgerId: ledgerId, // Reuse EXISTS logic
    };
    const periodEntries = await journalQueryService.getJournalEntries(periodFilter);

    // 4. Orchestrate grouping
    const voucherMap = new Map<string, BankBookVoucherDto>();
    const orderedVouchers: BankBookVoucherDto[] = [];

    for (const entry of periodEntries) {
      if (!voucherMap.has(entry.voucherId)) {
        const newVoucher: BankBookVoucherDto = {
          voucherId: entry.voucherId,
          voucherNumber: entry.voucherNumber,
          voucherDate: entry.voucherDate,
          voucherType: entry.voucherType,
          entries: [],
          runningBalance: { amount: 0, type: 'Dr' }, // Placeholder, computed next
        };
        voucherMap.set(entry.voucherId, newVoucher);
        orderedVouchers.push(newVoucher);
      }

      voucherMap.get(entry.voucherId)!.entries.push(entry);
    }

    // 5. Orchestrate running balances using BalanceComputationService
    let currentBalanceAmount = adjustedOpeningBalance.amount;
    let currentBalanceType = adjustedOpeningBalance.type;

    for (const voucher of orderedVouchers) {
      let voucherDebit = 0;
      let voucherCredit = 0;

      // Only movements belonging to the selected Bank ledger contribute
      for (const entry of voucher.entries) {
        if (entry.ledgerId === ledgerId) {
          voucherDebit += entry.debitAmount;
          voucherCredit += entry.creditAmount;
        }
      }

      const newBalance = balanceComputationService.calculateNetBalance(
        currentBalanceAmount,
        currentBalanceType,
        voucherDebit,
        voucherCredit,
      );

      voucher.runningBalance = newBalance;
      currentBalanceAmount = newBalance.amount;
      currentBalanceType = newBalance.type;
    }

    return {
      companyId,
      financialYearId,
      ledgerId,
      startDate,
      endDate,
      openingBalance: adjustedOpeningBalance,
      closingBalance: { amount: currentBalanceAmount, type: currentBalanceType },
      vouchers: orderedVouchers,
    };
  }
}

export const bankBookService = new BankBookService();
