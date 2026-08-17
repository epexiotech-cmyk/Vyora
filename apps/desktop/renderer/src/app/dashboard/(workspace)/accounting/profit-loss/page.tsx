'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { ProfitLossChart } from './_components/ProfitLossChart';
import { ProfitLossEmptyState } from './_components/ProfitLossEmptyState';
import { ProfitLossFilters, ProfitLossFilterValues } from './_components/ProfitLossFilters';
import { ProfitLossSummary } from './_components/ProfitLossSummary';
import { ProfitLossTables } from './_components/ProfitLossTables';
import { useProfitLoss } from './hooks/useProfitLoss';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ProfitLossPage() {
  const { data, isLoading, fetchProfitLoss } = useProfitLoss();

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

    fetchProfitLoss(asOfDateObj);
  }, [filters.asOfDate, fetchProfitLoss]);

  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profit & Loss"
        description="View your company's income, expenses, and net profit or loss"
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
