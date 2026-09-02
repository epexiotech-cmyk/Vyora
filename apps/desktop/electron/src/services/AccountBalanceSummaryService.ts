import { AccountBalanceSummaryDto, PaymentAccountBalanceDto } from '@vyora/types';

import { paymentAccountRepository } from '../repositories/PaymentAccountRepository';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';

export class AccountBalanceSummaryService {
  public async getAccountBalanceSummary(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
  ): Promise<AccountBalanceSummaryDto> {
    // 1. Fetch all active payment accounts for the company
    const allAccounts = await paymentAccountRepository.getByCompany(companyId);
    const activeAccounts = allAccounts.filter((a) => a.isActive);

    // 2. Fetch the bulk ledger movements which computes opening balance and entry sums efficiently in one query
    const bulkMovements = await journalQueryService.getBulkLedgerMovements(
      companyId,
      financialYearId,
      asOfDate,
      false, // includeInactive = false
    );

    const accountsResult: PaymentAccountBalanceDto[] = [];

    // 3. Map bulk movements to the payment accounts
    for (const account of activeAccounts) {
      const movement = bulkMovements.find((m) => m.ledgerId === account.ledgerId);

      let openingAmount = 0;
      let openingType: 'Dr' | 'Cr' = 'Dr';
      let debitTotal = 0;
      let creditTotal = 0;

      if (movement) {
        openingAmount = movement.openingBalance;
        openingType = movement.openingType;
        debitTotal = movement.totalDebit;
        creditTotal = movement.totalCredit;
      }

      const balance = balanceComputationService.calculateNetBalance(
        openingAmount,
        openingType,
        debitTotal,
        creditTotal,
      );

      const closingType = balance.amount === 0 ? 'ZERO' : balance.type === 'Dr' ? 'DR' : 'CR';
      const dtoOpeningType = openingAmount === 0 ? 'ZERO' : openingType === 'Dr' ? 'DR' : 'CR';

      accountsResult.push({
        accountId: account.id,
        accountName: account.displayName,
        accountType: account.accountType,
        ledgerId: account.ledgerId,
        isDefault: account.isDefault,
        openingBalance: {
          amount: openingAmount,
          type: dtoOpeningType,
        },
        debitTotal,
        creditTotal,
        closingBalance: {
          amount: balance.amount,
          type: closingType,
        },
      });
    }

    return {
      companyId,
      financialYearId,
      asOfDate,
      accounts: accountsResult,
    };
  }
}

export const accountBalanceSummaryService = new AccountBalanceSummaryService();
