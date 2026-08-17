import { PaymentAccountType } from '../accounting';

export interface PaymentAccountBalanceDto {
  accountId: string;
  accountName: string;
  accountType: PaymentAccountType;
  ledgerId: string;

  openingBalance: {
    amount: number;
    type: 'DR' | 'CR' | 'ZERO';
  };

  debitTotal: number;
  creditTotal: number;

  closingBalance: {
    amount: number;
    type: 'DR' | 'CR' | 'ZERO';
  };
}

export interface AccountBalanceSummaryDto {
  companyId: string;
  financialYearId: string;
  asOfDate?: Date;

  accounts: PaymentAccountBalanceDto[];
}
