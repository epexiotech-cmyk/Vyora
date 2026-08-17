'use client';

import { CustomerProfileDto } from '@vyora/types';
import * as React from 'react';

import { CompanyOnboardingWidget } from './_components/CompanyOnboardingWidget';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function DashboardPage() {
  const [customers, setCustomers] = React.useState<CustomerProfileDto[]>([]);
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.vyora?.db) {
        const res = await window.vyora.db.customers.search({});
        if (res.success) {
          setCustomers(res.data?.data || []);
          setStatus('connected');
        } else {
          setStatus('error');
          setErrorMsg(res.error || 'Unknown error');
        }
      }
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg((e as Error).message);
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      await loadData();
    };
    void init();
  }, [loadData]);

  const handleCreateTestCustomer = async () => {
    if (typeof window !== 'undefined' && window.vyora?.db) {
      // In a real app we'd fetch the default company ID. For test, pass a dummy or empty.
      const res = await window.vyora.db.customers.create({
        name: `Test Customer ${Math.floor(Math.random() * 1000)}`,
        city: 'Mumbai',
        openingBalance: 0,
        creditLimit: 0,
        creditDays: 0,
        isActive: true,
      });
      if (res.success) {
        loadData(); // Refresh
      } else {
        alert('Error creating: ' + res.error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Dashboard" description="Overview of your business performance." />

      <CompanyOnboardingWidget />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Database Status</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="flex items-center gap-2 text-xl font-bold capitalize">
              <span
                className={`h-3 w-3 rounded-full ${status === 'connected' ? 'bg-online' : status === 'error' ? 'bg-destructive' : 'bg-warning'}`}
              />
              {status}
            </div>
            {errorMsg && <p className="text-destructive mt-1 text-xs">{errorMsg}</p>}
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Total Customers</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </AppCardContent>
        </AppCard>
      </div>

      {status === 'connected' && (
        <div className="bg-background/50 mt-4 rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">IPC Database Test</h3>
            <AppButton onClick={handleCreateTestCustomer}>Add Test Customer</AppButton>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {customers.map((c) => (
              <div key={c.id} className="bg-secondary flex justify-between rounded-sm p-2 text-sm">
                <span>{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.id}</span>
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-muted-foreground text-sm">No customers found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
