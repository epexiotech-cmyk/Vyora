import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ViewPurchasePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="View Purchase" description={`Purchase ID: ${params.id}`} />
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center">
        Purchase view coming soon...
      </div>
    </div>
  );
}
