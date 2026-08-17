'use client';

import { AccountingDashboardDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

interface RecentJournalsProps {
  journals: AccountingDashboardDto['recentJournals'];
}

export function RecentJournals({ journals }: RecentJournalsProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="bg-card flex h-full flex-col rounded-xl border p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
        Recent Journal Entries
      </h3>

      {journals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No recent journal entries found.
        </div>
      ) : (
        <div className="-mx-6 -mb-6 flex-1 overflow-x-auto rounded-b-xl border-t border-slate-100 dark:border-slate-800/50">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-900/20">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Voucher
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {journals.map((journal) => (
                <tr
                  key={journal.id}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {formatDate(journal.date as unknown as Date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                    {journal.voucherNumber}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {formatCurrency(journal.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
