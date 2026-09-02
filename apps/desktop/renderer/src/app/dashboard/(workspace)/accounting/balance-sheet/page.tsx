'use client';

import { ExportFormat, ExportColumn, ExportRecord } from '@vyora/types';
import { getEndOfDay } from '@vyora/utils';
import * as React from 'react';
import { toast } from 'sonner';

import { BalanceSheetEmptyState } from './_components/BalanceSheetEmptyState';
import { BalanceSheetFilters, BalanceSheetFilterValues } from './_components/BalanceSheetFilters';
import { flattenBalanceSheetGroups, FlatBalanceSheetRow } from './_components/BalanceSheetSection';
import { BalanceSheetSummary } from './_components/BalanceSheetSummary';
import { BalanceSheetTables } from './_components/BalanceSheetTables';
import { useBalanceSheet } from './hooks/useBalanceSheet';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function BalanceSheetPage() {
  const { data, isLoading, fetchBalanceSheet } = useBalanceSheet();
  const { context } = useCompanyContext();
  const { exportData, isExporting } = useExport();

  const today = new Date();

  const [filters, setFilters] = React.useState<BalanceSheetFilterValues>({
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

    fetchBalanceSheet(asOfDateObj);
  }, [filters.asOfDate, fetchBalanceSheet]);

  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  const handleExport = async (format: ExportFormat) => {
    if (!data) {
      toast.error('No data available to export');
      return;
    }

    const exportRecords: ExportRecord[] = [];

    const pushRows = (
      typeLabel: string,
      sectionTitle: string,
      flatRows: FlatBalanceSheetRow[],
      totalAmount?: number,
    ) => {
      exportRecords.push({ type: typeLabel, particulars: sectionTitle.toUpperCase(), amount: '' });
      flatRows.forEach((row) => {
        if (row.type === 'group') {
          exportRecords.push({
            type: typeLabel,
            particulars: '  '.repeat(row.indentLevel + 1) + row.group.groupName,
            amount: row.group.totalBalance.amount,
          });
        } else {
          exportRecords.push({
            type: typeLabel,
            particulars: '  '.repeat(row.indentLevel + 1) + row.ledger.ledgerName,
            amount: row.ledger.balance.amount,
          });
        }
      });
      if (totalAmount !== undefined) {
        exportRecords.push({
          type: typeLabel,
          particulars: `Total ${sectionTitle}`,
          amount: totalAmount,
        });
      }
    };

    // Liabilities & Equity
    const liabilitiesAndEquityGroups = [...data.equityGroups, ...data.liabilityGroups];
    const flatLiabilitiesAndEquity = flattenBalanceSheetGroups(
      liabilitiesAndEquityGroups,
      0,
      filters.hideZeroBalances,
    );
    const totalLiabilitiesAndEquity = data.totalLiabilities.amount + data.totalEquity.amount;
    pushRows(
      'Liabilities & Equity',
      'Liabilities & Equity',
      flatLiabilitiesAndEquity,
      totalLiabilitiesAndEquity,
    );

    // Assets
    const flatAssets = flattenBalanceSheetGroups(data.assetGroups, 0, filters.hideZeroBalances);
    pushRows('Assets', 'Assets', flatAssets, data.totalAssets.amount);

    // Difference
    if (!data.isBalanced && data.difference.amount !== 0) {
      exportRecords.push({
        type: 'Summary',
        particulars: 'Difference in Opening Balances / Unbalanced Amount',
        amount: data.difference.amount,
      });
    }

    const columns: ExportColumn[] = [
      { key: 'type', header: 'Type', type: 'string' },
      { key: 'particulars', header: 'Particulars', type: 'string' },
      { key: 'amount', header: 'Amount', type: 'currency' },
    ];

    const filename = generateExportFilename('Balance_Sheet', format);

    await exportData(
      format,
      filename,
      columns,
      exportRecords,
      {
        title: 'Balance Sheet',
        subtitle: `As of ${filters.asOfDate}`,
        companyName: context?.company?.legalName,
      },
      {
        totalAssets: data.totalAssets.amount,
        totalLiabilities: data.totalLiabilities.amount,
        totalEquity: data.totalEquity.amount,
      },
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Balance Sheet"
        description="View your company's financial position including assets, liabilities, and equity"
        actions={<AppExportDropdown onExport={handleExport} isExporting={isExporting} />}
      />

      <BalanceSheetFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        isLoading={isLoading}
      />

      {!isLoading && data && (
        <>
          {data.assetGroups.length > 0 ||
          data.liabilityGroups.length > 0 ||
          data.equityGroups.length > 0 ? (
            <>
              <BalanceSheetSummary report={data} />
              <BalanceSheetTables report={data} hideZeroBalances={filters.hideZeroBalances} />
            </>
          ) : (
            <BalanceSheetEmptyState />
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
