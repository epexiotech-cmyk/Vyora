'use client';

import { SalesInvoiceDto } from '@vyora/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SalesInvoiceShell } from '../../_components/SalesInvoiceShell';

export default function EditSalesInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<SalesInvoiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInvoice() {
      try {
        const res = await window.vyora.db.sales.getById(invoiceId);
        if (!mounted) return;

        if (!res.success || !res.data) {
          setError(res.error || 'Failed to load invoice');
          return;
        }

        if (res.data.status !== 'DRAFT') {
          setError('DRAFT invoices only can be edited.');
          return;
        }

        setInvoice(res.data);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadInvoice();
    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-neutral-50">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
        <p className="font-medium text-neutral-600">Loading draft...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-neutral-50 p-6">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-neutral-800">Error Loading Draft</h2>
        <p className="max-w-md text-center text-neutral-600">{error}</p>
      </div>
    );
  }

  return <SalesInvoiceShell isEditMode initialData={invoice} />;
}
