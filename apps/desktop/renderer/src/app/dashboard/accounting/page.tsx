'use client';

import { AccountingDashboardDto } from '@vyora/types';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { AppCard } from '@/components/ui/AppCard';
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
      <SectionHeader title="Accounting Dashboard" description="Overview of accounting metrics" />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <AppCard title="Total Vouchers">
            <div className="text-3xl font-bold">{metrics?.totalVouchers || 0}</div>
          </AppCard>
          <AppCard title="Sales Vouchers">
            <div className="text-3xl font-bold">{metrics?.salesVoucherCount || 0}</div>
          </AppCard>
          <AppCard title="Purchase Vouchers">
            <div className="text-3xl font-bold">{metrics?.purchaseVoucherCount || 0}</div>
          </AppCard>
        </div>
      )}
    </div>
  );
}
