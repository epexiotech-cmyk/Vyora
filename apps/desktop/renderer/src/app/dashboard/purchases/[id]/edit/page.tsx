'use client';

import { PurchaseDto } from '@vyora/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { PurchaseForm } from '../../_components/PurchaseForm';

import { AppButton } from '@/components/ui/AppButton';

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = React.useState<PurchaseDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPurchase() {
      try {
        setLoading(true);
        const res = await window.vyora.db.purchases.getById(params.id);
        if (res.success && res.data) {
          if (res.data.status !== 'DRAFT') {
            // Redirect non-DRAFT invoices to read-only view
            router.replace(`/dashboard/purchases/${params.id}`);
            return;
          }
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load purchase');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPurchase();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">{error || 'Purchase not found'}</p>
        <AppButton variant="outline" onClick={() => router.push('/dashboard/purchases')}>
          Back to List
        </AppButton>
      </div>
    );
  }

  return <PurchaseForm initialData={data} isEditMode />;
}
