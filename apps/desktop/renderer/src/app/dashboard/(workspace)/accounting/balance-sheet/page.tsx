'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { BalanceSheetEmptyState } from './_components/BalanceSheetEmptyState';
import { BalanceSheetFilters, BalanceSheetFilterValues } from './_components/BalanceSheetFilters';
import { BalanceSheetSummary } from './_components/BalanceSheetSummary';
import { BalanceSheetTables } from './_components/BalanceSheetTables';
import { useBalanceSheet } from './hooks/useBalanceSheet';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function BalanceSheetPage() {
  const { data, isLoading, fetchBalanceSheet } = useBalanceSheet();

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

    const asOfDateObj = new Date(filters.asOfDate);
    const now = new Date();

    if (asOfDateObj > now) {
      toast.error('As of Date cannot be in the future');
      return;
    }

    try {
      const fyRes = await window.vyora.financialYear.getActive();
      if (fyRes.success && fyRes.data) {
        const fyStart = new Date(fyRes.data.startDate);
        const fyEnd = new Date(fyRes.data.endDate);

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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Balance Sheet"
        description="View your company's financial position including assets, liabilities, and equity"
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
