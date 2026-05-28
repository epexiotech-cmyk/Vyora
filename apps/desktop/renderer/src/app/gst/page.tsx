import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function GstPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <SectionHeader title="GST Returns" description="File and manage your GST returns." />
      <div className="bg-background/50 flex items-center justify-between rounded-md border p-4">
        <div>
          <h4 className="text-foreground font-medium">GSTR-1 (April 2026)</h4>
          <p className="text-muted-foreground text-sm">Due Date: 11th May 2026</p>
        </div>
        <StatusBadge variant="warning">Pending</StatusBadge>
      </div>
    </div>
  );
}
