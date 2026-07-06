import {
  StockSummaryDto,
  StockLedgerDto,
  StockMovementRegisterDto,
  StockAgeingDto,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { balanceSheetService } from '../../services/BalanceSheetService';
import { bankBookService } from '../../services/BankBookService';
import { cashBookService } from '../../services/CashBookService';
import { companyContextService } from '../../services/CompanyContextService';
import { dayBookService } from '../../services/DayBookService';
import { financialYearContextService } from '../../services/FinancialYearContextService';
import { generalLedgerService } from '../../services/GeneralLedgerService';
import { inventoryReportService } from '../../services/InventoryReportService';
import { ledgerStatementService } from '../../services/LedgerStatementService';
import { outstandingReportService } from '../../services/OutstandingReportService';
import { profitLossService } from '../../services/ProfitLossService';
import { trialBalanceService } from '../../services/TrialBalanceService';
import { createIpcHandler } from '../wrapper';
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

  ipcMain.handle(
    'reports:getDayBook',
    async (
      _event,
      args: { startDate?: Date; endDate?: Date; voucherType?: string; searchQuery?: string } = {},
    ) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Day Book: Missing company or financial year context');
      }

      return await dayBookService.getDayBook({
        companyId,
        financialYearId: financialYear.id,
        startDate: args.startDate,
        endDate: args.endDate,
        voucherType: args.voucherType as import('@vyora/database').VoucherType | undefined,
        searchQuery: args.searchQuery,
      });
    },
  );

  ipcMain.handle(
    'reports:getCashBook',
    async (
      _event,
      args: {
        ledgerId: string;
        startDate?: Date;
        endDate?: Date;
        voucherType?: string;
        searchQuery?: string;
      },
    ) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Cash Book: Missing company or financial year context');
      }

      return await cashBookService.getCashBook({
        companyId,
        financialYearId: financialYear.id,
        ledgerId: args.ledgerId,
        startDate: args.startDate,
        endDate: args.endDate,
        voucherType: args.voucherType as import('@vyora/database').VoucherType | undefined,
        searchQuery: args.searchQuery,
      });
    },
  );

  ipcMain.handle(
    'reports:getBankBook',
    async (
      _event,
      args: {
        ledgerId: string;
        startDate?: Date;
        endDate?: Date;
        voucherType?: string;
        searchQuery?: string;
      },
    ) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Bank Book: Missing company or financial year context');
      }

      return await bankBookService.getBankBook({
        companyId,
        financialYearId: financialYear.id,
        ledgerId: args.ledgerId,
        startDate: args.startDate,
        endDate: args.endDate,
        voucherType: args.voucherType as import('@vyora/database').VoucherType | undefined,
        searchQuery: args.searchQuery,
      });
    },
  );

  ipcMain.handle(
    'reports:getOutstandingSummary',
    async (
      _event,
      args: {
        reportType: 'CUSTOMER' | 'SUPPLIER';
        asOfDate?: Date;
      },
    ) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error(
          'Cannot generate Outstanding Report: Missing company or financial year context',
        );
      }

      return await outstandingReportService.getOutstandingSummary(
        companyId,
        financialYear.id,
        args.reportType,
        args.asOfDate,
      );
    },
  );

  createIpcHandler<StockSummaryDto>(
    'reports:getStockSummary',
    async (_, args: { asOfDate?: Date } = {}) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Stock Summary: Missing company or financial year context');
      }

      const data = await inventoryReportService.getStockSummaryReport(
        companyId,
        financialYear.id,
        args.asOfDate,
      );

      return { success: true, data };
    },
  );

  createIpcHandler<StockLedgerDto>(
    'reports:getStockLedger',
    async (
      _,
      args: {
        productId: string;
        productName: string;
        unitShortName: string;
        fromDate?: Date;
        toDate?: Date;
      },
    ) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Stock Ledger: Missing company or financial year context');
      }

      const data = await inventoryReportService.getStockLedgerReport(
        companyId,
        financialYear.id,
        args.productId,
        args.productName,
        args.unitShortName,
        args.fromDate,
        args.toDate,
      );

      return { success: true, data };
    },
  );

  createIpcHandler<StockMovementRegisterDto>(
    'reports:getStockMovementRegister',
    async (_, args: { fromDate?: Date; toDate?: Date } = {}) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error(
          'Cannot generate Stock Movement Register: Missing company or financial year context',
        );
      }

      const data = await inventoryReportService.getStockMovementRegisterReport(
        companyId,
        financialYear.id,
        args.fromDate,
        args.toDate,
      );

      return { success: true, data };
    },
  );

  createIpcHandler<StockAgeingDto>(
    'reports:getStockAgeing',
    async (_, args: { asOfDate?: Date } = {}) => {
      const companyId = companyContextService.getActiveCompany();
      const financialYear = financialYearContextService.getActiveFinancialYear();

      if (!companyId || !financialYear) {
        throw new Error('Cannot generate Stock Ageing: Missing company or financial year context');
      }

      const data = await inventoryReportService.getStockAgeingReport(
        companyId,
        financialYear.id,
        args.asOfDate,
      );

      return { success: true, data };
    },
  );
}
