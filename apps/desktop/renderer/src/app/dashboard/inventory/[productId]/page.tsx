import { Metadata } from 'next';

import { InventoryDetailPage } from './_components/InventoryDetailPage';

export const metadata: Metadata = {
  title: 'Item Inventory | Vyora',
  description: 'View inventory details and movement ledger for an item.',
};

export default async function ItemInventoryPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <InventoryDetailPage productId={productId} />;
}

export async function generateStaticParams() {
  return [{ productId: '1' }];
}
