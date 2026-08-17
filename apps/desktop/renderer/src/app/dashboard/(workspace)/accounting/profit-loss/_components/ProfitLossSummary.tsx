import { ProfitLossReport } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { TrendingUp, TrendingDown, Minus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import * as React from 'react';

import { AccountingDashboardCard } from '../../_components/AccountingDashboardCard';

interface ProfitLossSummaryProps {
  report: ProfitLossReport;
}

export function ProfitLossSummary({ report }: ProfitLossSummaryProps) {
  const { totalIncome, totalExpense, netResult, isProfit } = report;

  const isNeutral = netResult.amount === 0;

  let iconBgColor = 'bg-slate-50 dark:bg-slate-900/20';
  let iconColor = 'text-slate-500';
  let titleColor = 'text-slate-800 dark:text-slate-100';
  let IconComponent = Minus;
  let label = 'Neutral Result';

  if (!isNeutral) {
    if (isProfit) {
      iconBgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
      iconColor = 'text-emerald-500';
      titleColor = 'text-emerald-600 dark:text-emerald-500';
      IconComponent = TrendingUp;
      label = 'Net Profit';
    } else {
      iconBgColor = 'bg-rose-50 dark:bg-rose-900/20';
      iconColor = 'text-rose-500';
      titleColor = 'text-rose-600 dark:text-rose-500';
      IconComponent = TrendingDown;
      label = 'Net Loss';
    }
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
      <AccountingDashboardCard
        title="Total Expenses"
        icon={ArrowUpFromLine}
        iconBgColor="bg-rose-50 dark:bg-rose-900/20"
        iconColor="text-rose-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {formatCurrency(totalExpense.amount)}
          </div>
        </div>
      </AccountingDashboardCard>

      <AccountingDashboardCard
        title="Total Income"
        icon={ArrowDownToLine}
        iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        iconColor="text-emerald-500"
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {formatCurrency(totalIncome.amount)}
          </div>
        </div>
      </AccountingDashboardCard>

      <AccountingDashboardCard
        title={label}
        icon={IconComponent}
        iconBgColor={iconBgColor}
        iconColor={iconColor}
      >
        <div className="mt-2 flex flex-col gap-1">
          <div className={`text-3xl font-extrabold tracking-tight ${titleColor}`}>
            {formatCurrency(netResult.amount)}
          </div>
        </div>
      </AccountingDashboardCard>
    </div>
  );
}
