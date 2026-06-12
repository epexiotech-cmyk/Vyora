import { SectionHeader } from '@/components/ui/SectionHeader';

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Edit Purchase" description={`Purchase ID: ${params.id}`} />
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center">
        Purchase form (edit mode) coming soon...
      </div>
    </div>
  );
}
