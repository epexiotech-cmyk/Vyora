import { SectionHeader } from '@/components/ui/SectionHeader';

export default function NewPurchasePage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="New Purchase" description="Create a new purchase invoice." />
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center">
        Purchase form coming soon...
      </div>
    </div>
  );
}
