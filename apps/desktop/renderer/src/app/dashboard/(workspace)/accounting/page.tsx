'use client';

import { AccountingDashboardDto } from '@vyora/types';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { AccountingKPIs } from './_components/AccountingKPIs';
import { AccountSummary } from './_components/AccountSummary';
import { FinancialOverviewChart } from './_components/FinancialOverviewChart';
import { QuickActions } from './_components/QuickActions';
import { RecentJournals } from './_components/RecentJournals';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function AccountingDashboard() {
  const [metrics, setMetrics] = useState<AccountingDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await window.vyora.accounting.getDashboardMetrics();
        if (res.success) {
          setMetrics(res.data || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="Accounting Dashboard" description="Overview of accounting metrics" />
        {metrics?.lastUpdatedAt && (
          <div className="text-muted-foreground text-right text-sm">
            Last updated <br />
            {new Intl.DateTimeFormat('en-IN', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(metrics.lastUpdatedAt))}
          </div>
        )}
      </div>

      {loading || !metrics ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : (
        <div className="flex flex-col space-y-6">
          {/* Phase A: Modern ERP Dashboard Layout */}

          {/* Top Row: KPIs */}
          <AccountingKPIs metrics={metrics} />

          {/* Middle Row: Chart (2/3) and Journals (1/3) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FinancialOverviewChart />
            </div>
            <div className="lg:col-span-1">
              <RecentJournals journals={metrics.recentJournals} />
            </div>
          </div>

          {/* Bottom Row: Quick Actions and Reserved Space */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <QuickActions />
            <AccountSummary />
          </div>
        </div>
      )}
    </div>
  );
}
