import { ProfitLossReport } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

import { ProfitLossSection } from './ProfitLossSection';

interface ProfitLossTablesProps {
  report: ProfitLossReport;
  hideZeroBalances: boolean;
}

export function ProfitLossTables({ report, hideZeroBalances }: ProfitLossTablesProps) {
  return (
    <div className="mb-6 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
        {/* Expenses (Left Side) */}
        <div className="flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-center text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Expenses
            </h3>
          </div>
          <ProfitLossSection
            groups={report.expenseGroups}
            hideZeroBalances={hideZeroBalances}
            totalTitle="Total Expenses"
            totalAmount={report.totalExpense.amount}
          />
        </div>

        {/* Income (Right Side) */}
        <div className="flex flex-col">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-center text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Income
            </h3>
          </div>
          <ProfitLossSection
            groups={report.incomeGroups}
            hideZeroBalances={hideZeroBalances}
            totalTitle="Total Income"
            totalAmount={report.totalIncome.amount}
          />
        </div>
      </div>

      {/* Net Result Footer */}
      <div
        className={`flex items-center justify-between border-t px-6 py-5 dark:border-slate-800 ${report.isProfit ? 'bg-emerald-50 dark:bg-emerald-900/10' : report.netResult.amount === 0 ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-rose-50 dark:bg-rose-900/10'}`}
      >
        <span
          className={`text-lg font-extrabold tracking-tight ${report.isProfit ? 'text-emerald-700 dark:text-emerald-500' : report.netResult.amount === 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-700 dark:text-rose-500'}`}
        >
          {report.isProfit
            ? 'Net Profit'
            : report.netResult.amount === 0
              ? 'Net Result'
              : 'Net Loss'}
        </span>
        <span
          className={`text-xl font-extrabold tracking-tight ${report.isProfit ? 'text-emerald-700 dark:text-emerald-500' : report.netResult.amount === 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-700 dark:text-rose-500'}`}
        >
          {formatCurrency(report.netResult.amount)}
        </span>
      </div>
    </div>
  );
}
