import { Metadata } from 'next';

import { InventoryDashboard } from './_components/InventoryDashboard';

export const metadata: Metadata = {
  title: 'Global Inventory | Vyora',
  description: 'View real-time stock balances and valuation across the active financial year.',
};

export default function InventoryPage() {
  return <InventoryDashboard />;
}
