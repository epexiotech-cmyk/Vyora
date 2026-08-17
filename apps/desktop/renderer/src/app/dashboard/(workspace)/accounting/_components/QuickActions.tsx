'use client';

import { FileText, ListTree, Scale, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { AccountingDashboardCard } from './AccountingDashboardCard';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'New Journal',
      icon: FileText,
      href: '/dashboard/accounting/journal/new',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'New Ledger',
      icon: ListTree,
      href: '/dashboard/accounting/chart-of-accounts?action=new-ledger',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Trial Balance',
      icon: Scale,
      href: '/dashboard/accounting/trial-balance',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Balance Sheet',
      icon: Building,
      href: '/dashboard/accounting/balance-sheet',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <AccountingDashboardCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bg} ${action.color}`}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </AccountingDashboardCard>
  );
}
