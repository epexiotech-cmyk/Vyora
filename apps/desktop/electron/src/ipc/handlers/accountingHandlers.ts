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
  ListSettlementsOptions,
  SettlementListDto,
  SettlementDto,
  CreateSettlementInput,
  UpdateSettlementInput,
} from '@vyora/types';

import { journalService } from '../../services/JournalService';
import { settlementService } from '../../services/SettlementService';
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

  createIpcHandler<{ cancelledSettlementId: string }>(
    'accounting:cancelSettlement',
    async (_event, settlementId: string) => {
      const data = await settlementService.cancelSettlement(settlementId);
      return { success: true, data };
    },
  );

  createIpcHandler<SettlementListDto>(
    'accounting:listSettlements',
    async (_event, options: ListSettlementsOptions) => {
      const data = await settlementService.listSettlements(options);
      return { success: true, data };
    },
  );

  createIpcHandler<SettlementDto>(
    'accounting:getSettlementById',
    async (_event, settlementId: string) => {
      const data = await settlementService.getSettlementById(settlementId);
      return { success: true, data };
    },
  );

  createIpcHandler<{ settlementId: string }>(
    'accounting:createSettlement',
    async (_event, input: CreateSettlementInput) => {
      const data = await settlementService.createSettlement(input);
      return { success: true, data };
    },
  );

  createIpcHandler<{ settlementId: string }>(
    'accounting:editSettlement',
    async (_event, settlementId: string, input: UpdateSettlementInput) => {
      const data = await settlementService.editSettlement(settlementId, input);
      return { success: true, data };
    },
  );

  createIpcHandler<import('@vyora/types').OutstandingDocumentDto[]>(
    'accounting:getOutstandingForCustomer',
    async (_event, customerId: string) => {
      const data = await settlementService.getOutstandingDocuments('CUSTOMER', customerId);
      return { success: true, data };
    },
  );

  createIpcHandler<import('@vyora/types').OutstandingDocumentDto[]>(
    'accounting:getOutstandingForSupplier',
    async (_event, supplierId: string) => {
      const data = await settlementService.getOutstandingDocuments('SUPPLIER', supplierId);
      return { success: true, data };
    },
  );
}
