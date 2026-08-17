'use client';

import { ProductDto } from '@vyora/types';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import { ItemForm } from '../_components/ItemForm';

export default function EditItemPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const [data, setData] = React.useState<ProductDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadItem() {
      try {
        const res = await window.vyora.db.products.getById(id);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Item not found.');
        }
      } catch {
        setError('An error occurred while loading the item.');
      } finally {
        setIsLoading(false);
      }
    }
    loadItem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground animate-pulse text-sm">Loading item details...</p>
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

  return (
    <ItemForm
      initialData={
        data as unknown as import('@vyora/types').CreateProductInput & { id?: string; sku?: string }
      }
      isEditMode={true}
    />
  );
}
