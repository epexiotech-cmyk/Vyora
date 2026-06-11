'use client';

import { SupplierProfileDto } from '@vyora/types';
import { useParams } from 'next/navigation';
import * as React from 'react';

import { SupplierForm } from '../_components/SupplierForm';

export default function EditSupplierPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = React.useState<SupplierProfileDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSupplier() {
      try {
        const res = await window.vyora.db.suppliers.getById(id);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Supplier not found.');
        }
      } catch {
        setError('An error occurred while loading the supplier.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSupplier();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground animate-pulse text-sm">Loading supplier details...</p>
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

  return <SupplierForm initialData={data} isEditMode={true} />;
}
