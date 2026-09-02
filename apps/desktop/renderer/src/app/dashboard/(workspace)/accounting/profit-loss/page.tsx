'use client';

import { ExportFormat, ExportColumn, ExportRecord } from '@vyora/types';
import { getEndOfDay } from '@vyora/utils';
import * as React from 'react';
import { toast } from 'sonner';

import { ProfitLossChart } from './_components/ProfitLossChart';
import { ProfitLossEmptyState } from './_components/ProfitLossEmptyState';
import { ProfitLossFilters, ProfitLossFilterValues } from './_components/ProfitLossFilters';
import { flattenProfitLossGroups } from './_components/ProfitLossSection';
import { ProfitLossSummary } from './_components/ProfitLossSummary';
import { ProfitLossTables } from './_components/ProfitLossTables';
import { useProfitLoss } from './hooks/useProfitLoss';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function ProfitLossPage() {
  const { data, isLoading, fetchProfitLoss } = useProfitLoss();
  const { context } = useCompanyContext();
  const { exportData, isExporting } = useExport();

  const today = new Date();

  const [filters, setFilters] = React.useState<ProfitLossFilterValues>({
    asOfDate: today.toISOString().split('T')[0],
    hideZeroBalances: false,
  });

  const handleApply = React.useCallback(async () => {
    if (!filters.asOfDate) {
      toast.error('As of Date is required');
      return;
    }

    const asOfDateObj = getEndOfDay(filters.asOfDate);
    const now = new Date();

    if (asOfDateObj > getEndOfDay(now)) {
      toast.error('As of Date cannot be in the future');
      return;
    }

    try {
      const fyRes = await window.vyora.financialYear.getActive();
      if (fyRes.success && fyRes.data) {
        const fyStart = new Date(fyRes.data.startDate);
        const fyEnd = getEndOfDay(fyRes.data.endDate);

        if (asOfDateObj < fyStart || asOfDateObj > fyEnd) {
          toast.error('As of Date must be within the active financial year');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to validate financial year', e);
    }

    fetchProfitLoss(asOfDateObj);
  }, [filters.asOfDate, fetchProfitLoss]);

  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  const handleExport = async (format: ExportFormat) => {
    if (!data) {
      toast.error('No data available to export');
      return;
    }

    const exportRecords: ExportRecord[] = [];

    // Expenses
    const flatExpenseRows = flattenProfitLossGroups(
      data.expenseGroups,
      0,
      filters.hideZeroBalances,
    );
    exportRecords.push({ type: 'Expense', particulars: 'EXPENSES', amount: '' });
    flatExpenseRows.forEach((row) => {
      if (row.type === 'group') {
        exportRecords.push({
          type: 'Expense',
          particulars: '  '.repeat(row.indentLevel + 1) + row.group.groupName,
          amount: row.group.totalBalance.amount,
        });
      } else {
        exportRecords.push({
          type: 'Expense',
          particulars: '  '.repeat(row.indentLevel + 1) + row.ledger.ledgerName,
          amount: row.ledger.balance.amount,
        });
      }
    });
    exportRecords.push({
      type: 'Expense',
      particulars: 'Total Expenses',
      amount: data.totalExpense.amount,
    });

    // Income
    const flatIncomeRows = flattenProfitLossGroups(data.incomeGroups, 0, filters.hideZeroBalances);
    exportRecords.push({ type: 'Income', particulars: 'INCOME', amount: '' });
    flatIncomeRows.forEach((row) => {
      if (row.type === 'group') {
        exportRecords.push({
          type: 'Income',
          particulars: '  '.repeat(row.indentLevel + 1) + row.group.groupName,
          amount: row.group.totalBalance.amount,
        });
      } else {
        exportRecords.push({
          type: 'Income',
          particulars: '  '.repeat(row.indentLevel + 1) + row.ledger.ledgerName,
          amount: row.ledger.balance.amount,
        });
      }
    });
    exportRecords.push({
      type: 'Income',
      particulars: 'Total Income',
      amount: data.totalIncome.amount,
    });

    // Net Result
    const netResultLabel = data.isProfit
      ? 'Net Profit'
      : data.netResult.amount === 0
        ? 'Net Result'
        : 'Net Loss';
    exportRecords.push({
      type: 'Summary',
      particulars: netResultLabel,
      amount: data.netResult.amount,
    });

    const columns: ExportColumn[] = [
      { key: 'type', header: 'Type', type: 'string' },
      { key: 'particulars', header: 'Particulars', type: 'string' },
      { key: 'amount', header: 'Amount', type: 'currency' },
    ];

    const filename = generateExportFilename('Profit_Loss', format);

    await exportData(
      format,
      filename,
      columns,
      exportRecords,
      {
        title: 'Profit & Loss',
        subtitle: `As of ${filters.asOfDate}`,
        companyName: context?.company?.legalName,
      },
      {
        totalIncome: data.totalIncome.amount,
        totalExpense: data.totalExpense.amount,
        netResult: data.netResult.amount,
      },
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profit & Loss"
        description="View your company's income, expenses, and net profit or loss"
        actions={<AppExportDropdown onExport={handleExport} isExporting={isExporting} />}
      />

      <ProfitLossFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        isLoading={isLoading}
      />

      {!isLoading && data && (
        <>
          {data.incomeGroups.length > 0 || data.expenseGroups.length > 0 ? (
            <>
              <ProfitLossChart report={data} />
              <ProfitLossSummary report={data} />
              <ProfitLossTables report={data} hideZeroBalances={filters.hideZeroBalances} />
            </>
          ) : (
            <ProfitLossEmptyState />
          )}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
