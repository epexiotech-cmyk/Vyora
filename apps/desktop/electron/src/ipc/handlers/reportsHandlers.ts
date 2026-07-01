import { ipcMain } from 'electron';

import { balanceSheetService } from '../../services/BalanceSheetService';
import { companyContextService } from '../../services/CompanyContextService';
import { financialYearContextService } from '../../services/FinancialYearContextService';
import { generalLedgerService } from '../../services/GeneralLedgerService';
import { ledgerStatementService } from '../../services/LedgerStatementService';
import { profitLossService } from '../../services/ProfitLossService';
import { trialBalanceService } from '../../services/TrialBalanceService';

export function registerReportsHandlers() {
  ipcMain.handle(
    'reports:getLedgerStatement',
    async (
      _,
      args: {
        ledgerId: string;
        startDate?: string;
        endDate?: string;
      },
    ) => {
      try {
        const companyId = companyContextService.getActiveCompany();
        const fy = financialYearContextService.getActiveFinancialYear();

        if (!companyId) throw new Error('No active company');
        if (!fy) throw new Error('No active financial year');

        const startDateObj = args.startDate ? new Date(args.startDate) : undefined;
        const endDateObj = args.endDate ? new Date(args.endDate) : undefined;

        return await ledgerStatementService.getLedgerStatement(
          companyId,
          fy.id,
          args.ledgerId,
          startDateObj,
          endDateObj,
        );
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to fetch ledger statement',
        );
      }
    },
  );

  ipcMain.handle(
    'reports:getGeneralLedger',
    async (_event, args: { startDate?: Date; endDate?: Date } = {}) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error(
          'Cannot generate General Ledger: Missing company or financial year context',
        );
      }

      return await generalLedgerService.getGeneralLedger(
        companyId,
        financialYear.id,
        args.startDate,
        args.endDate,
      );
    },
  );

  ipcMain.handle('reports:getTrialBalance', async (_, asOfDate?: Date) => {
    const companyId = companyContextService.getActiveCompany();
    const financialYear = financialYearContextService.getActiveFinancialYear();

    if (!companyId) throw new Error('No active company selected.');
    if (!financialYear) throw new Error('No active financial year selected.');

    return trialBalanceService.getTrialBalance(companyId, financialYear.id, asOfDate);
  });

  ipcMain.handle('reports:getProfitLoss', async (_, asOfDate?: Date) => {
    const companyId = companyContextService.getActiveCompany();
    const financialYear = financialYearContextService.getActiveFinancialYear();

    if (!companyId) throw new Error('No active company selected.');
    if (!financialYear) throw new Error('No active financial year selected.');

    return profitLossService.getProfitLoss(companyId, financialYear.id, asOfDate);
  });

  ipcMain.handle('reports:getBalanceSheet', async (_, asOfDate?: Date) => {
    const companyId = companyContextService.getActiveCompany();
    const financialYear = financialYearContextService.getActiveFinancialYear();

    if (!companyId) throw new Error('No active company selected.');
    if (!financialYear) throw new Error('No active financial year selected.');

    return balanceSheetService.getBalanceSheet(companyId, financialYear.id, asOfDate);
  });
}
