import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';
import { financialYearContextService } from '../../services/FinancialYearContextService';
import { ledgerStatementService } from '../../services/LedgerStatementService';

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
}
