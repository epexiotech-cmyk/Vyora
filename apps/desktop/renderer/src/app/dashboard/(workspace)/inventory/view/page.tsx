import { Metadata } from 'next';
import { Suspense } from 'react';

import { InventoryDetailPage } from './_components/InventoryDetailPage';

export const metadata: Metadata = {
  title: 'Item Inventory | Vyora',
  description: 'View inventory details and movement ledger for an item.',
};

export default function ItemInventoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryDetailPage />
    </Suspense>
  );
}
