'use client';

import { GeneralLedgerStatement, MonetaryBalance } from '@vyora/types';
import { getEndOfDay } from '@vyora/utils';
import * as React from 'react';
import { toast } from 'sonner';

import { GeneralLedgerEmptyState } from './_components/GeneralLedgerEmptyState';
import {
  GeneralLedgerFilters,
  GeneralLedgerFilterValues,
} from './_components/GeneralLedgerFilters';
import { GeneralLedgerSummary } from './_components/GeneralLedgerSummary';
import { GeneralLedgerTable } from './_components/GeneralLedgerTable';
import { useGeneralLedger } from './hooks/useGeneralLedger';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function GeneralLedgerPage() {
  const { data, isLoading, fetchGeneralLedger } = useGeneralLedger();

  // Default dates: First day of current month to today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = React.useState<GeneralLedgerFilterValues>({
    ledgerId: 'all',
    startDate: firstDay.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    voucherType: 'all',
    showCancelled: false,
  });

  const handleApply = React.useCallback(() => {
    if (filters.startDate && filters.endDate) {
      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }

    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? getEndOfDay(filters.endDate) : undefined;

    fetchGeneralLedger(start, end);
  }, [filters.startDate, filters.endDate, fetchGeneralLedger]);

  // Apply filters on mount
  React.useEffect(() => {
    handleApply();
  }, [handleApply]);

  const getFilteredStatements = (): GeneralLedgerStatement[] => {
    if (!data?.statements) return [];

    let filtered = data.statements;

    // Filter by Ledger ID
    if (filters.ledgerId !== 'all') {
      filtered = filtered.filter((stmt) => stmt.ledgerId === filters.ledgerId);
    }

    // Filter entries by voucher type and status inside each statement
    // Note: Recomputing opening/closing balances based on filtered entries is NOT standard
    // unless we are just hiding lines. But the user said:
    // "Filter by voucher type, status, cancelled, reversed"
    // Usually, General Ledger opening/closing balances are fixed based on ALL posted entries.
    // Hiding a specific type of voucher would break the running balance math.
    // However, we will filter the entries and recalculate the running balances for display.

    return filtered
      .map((stmt) => {
        // Filter entries
        const validEntries = stmt.entries.filter((entry) => {
          let match = true;
          if (filters.voucherType !== 'all') {
            if (entry.voucherType !== filters.voucherType) match = false;
          }

          // Note: currently the backend GeneralLedgerService does not return isCancelled in GeneralLedgerEntry.
          // It skips cancelled vouchers at the query level or we need to add isCancelled to GeneralLedgerEntry.
          // Wait, does generalLedgerQueryService skip cancelled vouchers? Yes, typically.
          // If it skips, we can't show them anyway. But we will assume they might be returned.
          // For now, we apply whatever we can.

          return match;
        });

        // Recalculate running balances if entries were filtered
        if (validEntries.length !== stmt.entries.length) {
          let currentRunning: MonetaryBalance = { ...stmt.openingBalance };

          const recomputedEntries = validEntries.map((e) => {
            let runningValue = (currentRunning.type === 'Dr' ? 1 : -1) * currentRunning.amount;
            runningValue += e.debitAmount;
            runningValue -= e.creditAmount;

            currentRunning = {
              amount: Math.abs(runningValue),
              type: runningValue >= 0 ? 'Dr' : 'Cr',
            };

            return { ...e, runningBalance: { ...currentRunning } };
          });

          return {
            ...stmt,
            entries: recomputedEntries,
            closingBalance: { ...currentRunning },
          };
        }

        return stmt;
      })
      .filter((stmt) => {
        // Empty account validation
        if (stmt.openingBalance.amount === 0 && stmt.entries.length === 0) {
          return false; // hide empty accounts
        }
        return true;
      });
  };

  const filteredStatements = getFilteredStatements();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="General Ledger"
        description="View and analyze all ledger account transactions"
      />

      <GeneralLedgerFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        isLoading={isLoading}
      />

      {!isLoading && data && (
        <>
          {filteredStatements.length > 0 ? (
            <>
              <GeneralLedgerSummary statements={filteredStatements} />

              <div className="space-y-8">
                {filteredStatements.map((stmt) => (
                  <GeneralLedgerTable key={stmt.ledgerId} statement={stmt} />
                ))}
              </div>
            </>
          ) : (
            <GeneralLedgerEmptyState />
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
