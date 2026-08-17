import {
  AccountingDashboardDto,
  LedgerStatementDto,
  TrialBalanceDto,
  VoucherDetailDto,
  VoucherFilterDto,
  VoucherListItemDto,
  LedgerLookupDto,
  FinancialOverviewChartRequestDto,
  FinancialOverviewChartResponseDto,
} from '@vyora/types';

import { journalService } from '../../services/JournalService';
import { createIpcHandler } from '../wrapper';

export function registerAccountingHandlers() {
  createIpcHandler<VoucherDetailDto>(
    'accounting:getVoucherById',
    async (_event, voucherId: string) => {
      const data = await journalService.getVoucherById(voucherId);
      return { success: true, data };
    },
  );

  createIpcHandler<VoucherListItemDto[]>(
    'accounting:listVouchers',
    async (_event, filter: VoucherFilterDto) => {
      const data = await journalService.listVouchers(filter || {});
      return { success: true, data };
    },
  );

  createIpcHandler<TrialBalanceDto>('accounting:getTrialBalance', async () => {
    const data = await journalService.getTrialBalance();
    return { success: true, data };
  });

  createIpcHandler<LedgerStatementDto>(
    'accounting:getLedgerStatement',
    async (_event, ledgerId: string, fromDate: Date, toDate: Date) => {
      const data = await journalService.getLedgerStatement(
        ledgerId,
        new Date(fromDate),
        new Date(toDate),
      );
      return { success: true, data };
    },
  );

  createIpcHandler<AccountingDashboardDto>('accounting:getDashboardMetrics', async () => {
    const data = await journalService.getDashboardMetrics();
    return { success: true, data };
  });

  createIpcHandler<LedgerLookupDto[]>('accounting:getActiveLedgers', async () => {
    const data = await journalService.getActiveLedgers();
    return { success: true, data };
  });
  createIpcHandler<FinancialOverviewChartResponseDto[]>(
    'accounting:getFinancialOverviewChart',
    async (_event, req: FinancialOverviewChartRequestDto) => {
      const data = await journalService.getFinancialOverviewChart(req);
      return { success: true, data };
    },
  );
}
