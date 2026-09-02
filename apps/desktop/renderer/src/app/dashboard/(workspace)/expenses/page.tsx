import { PurchaseList } from '../purchases/_components/PurchaseList';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Expenses"
        description="Manage your indirect expenses, cash payments, and bills."
      />
      <PurchaseList documentType="EXPENSE" />
    </div>
  );
}
