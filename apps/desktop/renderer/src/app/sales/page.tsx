import { Plus } from 'lucide-react';

import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function SalesPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <SectionHeader
        title="Sales Invoices"
        description="Manage your sales and generate invoices."
        actions={
          <AppButton size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </AppButton>
        }
      />

      <div className="border-border/50 bg-background/30 flex flex-1 items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <h3 className="text-foreground text-lg font-medium">No Sales Found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your first invoice to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
