import { PurchaseList } from './_components/PurchaseList';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Purchases" description="Manage your purchase invoices and bills." />
      <PurchaseList />
    </div>
  );
}
