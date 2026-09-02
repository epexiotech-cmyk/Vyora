'use client';

import { CustomerProfileDto } from '@vyora/types';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import { CustomerForm } from '../_components/CustomerForm';

export default function EditCustomerPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const [data, setData] = React.useState<CustomerProfileDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadCustomer() {
      try {
        const res = await window.vyora.db.customers.getById(id);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Customer not found.');
        }
      } catch {
        setError('An error occurred while loading the customer.');
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground animate-pulse text-sm">Loading customer details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="text-destructive mb-4 text-sm">{error}</p>
      </div>
    );
  }

  // @ts-expect-error - CustomerProfileDto strict type mismatch on defaultPaymentAccountId
  return <CustomerForm initialData={data} isEditMode={true} />;
}
