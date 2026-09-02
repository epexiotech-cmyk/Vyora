'use client';

import { ExportFormat, ExportColumn, ExportRecord } from '@vyora/types';
import { getEndOfDay } from '@vyora/utils';
import * as React from 'react';
import { toast } from 'sonner';

import { TrialBalanceEmptyState } from './_components/TrialBalanceEmptyState';
import { TrialBalanceFilters, TrialBalanceFilterValues } from './_components/TrialBalanceFilters';
import { TrialBalanceSummary } from './_components/TrialBalanceSummary';
import { TrialBalanceTable } from './_components/TrialBalanceTable';
import { flattenGroups } from './_components/TrialBalanceTable';
import { useTrialBalance } from './hooks/useTrialBalance';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function TrialBalancePage() {
  const { data, isLoading, fetchTrialBalance } = useTrialBalance();
  const { context } = useCompanyContext();
  const { exportData, isExporting } = useExport();

  const today = new Date();

  const [filters, setFilters] = React.useState<TrialBalanceFilterValues>({
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

    fetchTrialBalance(asOfDateObj);
  }, [filters.asOfDate, fetchTrialBalance]);

  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  const handleExport = async (format: ExportFormat) => {
    if (!data) {
      toast.error('No data available to export');
      return;
    }

    const flatRows = flattenGroups(data.groups, 0, filters.hideZeroBalances);
    const exportRecords: ExportRecord[] = flatRows.map((row) => {
      if (row.type === 'group') {
        const isDebit = row.group.totalBalance.type === 'Dr';
        const isCredit = row.group.totalBalance.type === 'Cr';
        const amount = row.group.totalBalance.amount;

        return {
          account: '  '.repeat(row.indentLevel) + row.group.groupName,
          debit: isDebit && amount > 0 ? amount : 0,
          credit: isCredit && amount > 0 ? amount : 0,
        };
      } else {
        const isDebit = row.ledger.closingBalance.type === 'Dr';
        const isCredit = row.ledger.closingBalance.type === 'Cr';
        const amount = row.ledger.closingBalance.amount;

        return {
          account: '  '.repeat(row.indentLevel) + row.ledger.ledgerName,
          debit: isDebit && amount > 0 ? amount : 0,
          credit: isCredit && amount > 0 ? amount : 0,
        };
      }
    });

    const columns: ExportColumn[] = [
      { key: 'account', header: 'Account / Group', type: 'string' },
      { key: 'debit', header: 'Debit (Dr)', type: 'currency' },
      { key: 'credit', header: 'Credit (Cr)', type: 'currency' },
    ];

    const filename = generateExportFilename('Trial_Balance', format);

    await exportData(
      format,
      filename,
      columns,
      exportRecords,
      {
        title: 'Trial Balance',
        subtitle: `As of ${filters.asOfDate}`,
        companyName: context?.company?.legalName,
      },
      {
        debit: data.grandTotalDebit,
        credit: data.grandTotalCredit,
      },
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trial Balance"
        description="View a summary of all ledger balances as of a specific date"
        actions={<AppExportDropdown onExport={handleExport} isExporting={isExporting} />}
      />

      <TrialBalanceFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        isLoading={isLoading}
      />

      {!isLoading && data && (
        <>
          {data.groups && data.groups.length > 0 ? (
            <>
              <TrialBalanceSummary report={data} />
              <TrialBalanceTable report={data} hideZeroBalances={filters.hideZeroBalances} />
            </>
          ) : (
            <TrialBalanceEmptyState />
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
