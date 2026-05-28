import { Plus } from 'lucide-react';

import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function PurchasePage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <SectionHeader
        title="Purchase Bills"
        description="Record your vendor purchases."
        actions={
          <AppButton size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Bill
          </AppButton>
        }
      />
      <div className="border-border/50 bg-background/30 flex flex-1 items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <h3 className="text-foreground text-lg font-medium">No Purchases Found</h3>
          <p className="text-muted-foreground mt-1 text-sm">Record your first purchase bill.</p>
        </div>
      </div>
    </div>
  );
}
