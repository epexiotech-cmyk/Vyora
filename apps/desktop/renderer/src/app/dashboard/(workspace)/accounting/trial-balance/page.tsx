'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { TrialBalanceEmptyState } from './_components/TrialBalanceEmptyState';
import { TrialBalanceFilters, TrialBalanceFilterValues } from './_components/TrialBalanceFilters';
import { TrialBalanceSummary } from './_components/TrialBalanceSummary';
import { TrialBalanceTable } from './_components/TrialBalanceTable';
import { useTrialBalance } from './hooks/useTrialBalance';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function TrialBalancePage() {
  const { data, isLoading, fetchTrialBalance } = useTrialBalance();

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

    fetchTrialBalance(asOfDateObj);
  }, [filters.asOfDate, fetchTrialBalance]);

  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trial Balance"
        description="View a summary of all ledger balances as of a specific date"
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
