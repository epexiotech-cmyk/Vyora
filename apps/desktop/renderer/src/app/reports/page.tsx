import { AppCard, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ReportsPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <SectionHeader
        title="Business Reports"
        description="Generate insights and financial statements."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard className="hover:border-primary/50 cursor-pointer transition-colors">
          <AppCardHeader>
            <AppCardTitle>Profit & Loss</AppCardTitle>
          </AppCardHeader>
        </AppCard>
        <AppCard className="hover:border-primary/50 cursor-pointer transition-colors">
          <AppCardHeader>
            <AppCardTitle>Balance Sheet</AppCardTitle>
          </AppCardHeader>
        </AppCard>
        <AppCard className="hover:border-primary/50 cursor-pointer transition-colors">
          <AppCardHeader>
            <AppCardTitle>Day Book</AppCardTitle>
          </AppCardHeader>
        </AppCard>
      </div>
    </div>
  );
}
