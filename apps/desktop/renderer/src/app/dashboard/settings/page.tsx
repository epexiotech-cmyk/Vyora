import { AppCard, AppCardHeader, AppCardTitle, AppCardContent } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <SectionHeader
        title="Settings"
        description="Configure your company and application preferences."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Company Profile</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-muted-foreground text-sm">
              Manage your business details, address, and GSTIN.
            </p>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>Tax & Compliance</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-muted-foreground text-sm">
              Configure GST rates, HSN codes, and e-invoicing.
            </p>
          </AppCardContent>
        </AppCard>
      </div>
    </div>
  );
}
