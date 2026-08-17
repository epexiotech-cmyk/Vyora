import { Wallet } from 'lucide-react';
import * as React from 'react';

import { AccountingDashboardCard } from './AccountingDashboardCard';

export function AccountSummary() {
  return (
    <AccountingDashboardCard title="Financial Summary" icon={Wallet}>
      <div className="flex h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mb-2 flex items-center justify-center rounded-full bg-slate-100 p-3 dark:bg-slate-800">
          <Wallet className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium">Coming soon</p>
        <p className="text-xs text-slate-400">Cash, Bank, Receivables & Payables</p>
      </div>
    </AccountingDashboardCard>
  );
}
