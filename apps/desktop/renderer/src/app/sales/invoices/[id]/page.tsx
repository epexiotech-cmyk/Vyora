'use client';

import { SalesInvoiceDto } from '@vyora/types';
import * as React from 'react';

import { InvoiceForm } from '../components/InvoiceForm';

export default function EditSalesInvoicePage({ params }: { params: { id: string } }) {
  const [initialData, setInitialData] = React.useState<SalesInvoiceDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await window.vyora.db.sales.getById(params.id);
        if (res.success && res.data) {
          setInitialData(res.data);
        }
      } catch (error) {
        console.error('Failed to load invoice', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading Invoice...</div>;
  }

  if (!initialData) {
    return (
      <div className="text-destructive flex h-full items-center justify-center">
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <InvoiceForm mode="edit" initialData={initialData} />
    </div>
  );
}
