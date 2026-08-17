'use client';

import { AccountingDashboardDto } from '@vyora/types';
import { ListTree, FileText, Scale, TrendingUp } from 'lucide-react';
import * as React from 'react';

import { AccountingDashboardCard } from './AccountingDashboardCard';

interface AccountingKPIsProps {
  metrics: AccountingDashboardDto;
}

export function AccountingKPIs({ metrics }: AccountingKPIsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <AccountingDashboardCard
        title="Ledger Accounts"
        icon={ListTree}
        iconBgColor="bg-blue-50 dark:bg-blue-900/20"
        iconColor="text-blue-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {metrics.totalLedgers}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Active ledgers
          </div>
        </div>
      </AccountingDashboardCard>

      <AccountingDashboardCard
        title="Journal Entries"
        icon={FileText}
        iconBgColor="bg-orange-50 dark:bg-orange-900/20"
        iconColor="text-orange-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {metrics.totalJournalEntries}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Current financial year
          </div>
        </div>
      </AccountingDashboardCard>

      <AccountingDashboardCard
        title="Trial Balance"
        icon={Scale}
        iconBgColor="bg-purple-50 dark:bg-purple-900/20"
        iconColor="text-purple-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {metrics.trialBalanceStatus.isBalanced ? (
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
                Balanced
              </span>
            ) : (
              <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-500">
                Unbalanced
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Difference{' '}
            {formatCurrency(
              metrics.trialBalanceStatus.isBalanced ? 0 : metrics.trialBalanceStatus.difference,
            )}
          </div>
        </div>
      </AccountingDashboardCard>

      <AccountingDashboardCard
        title="Net Profit"
        icon={TrendingUp}
        iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        iconColor="text-emerald-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div
            className={`text-3xl font-extrabold tracking-tight ${metrics.currentProfitLoss < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}
          >
            {formatCurrency(metrics.currentProfitLoss)}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Current FY</div>
        </div>
      </AccountingDashboardCard>
    </div>
  );
}
