import Link from 'next/link';

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
        <Link href="/dashboard/settings/company-profile">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Company Profile</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Manage your business details, address, and GSTIN.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>

        <Link href="/dashboard/settings/companies">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Companies</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Manage multiple companies and switch between them.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>

        <Link href="/dashboard/settings/financial-years">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Financial Years</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Manage your financial periods and active years.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>

        <Link href="/dashboard/settings/tax-compliance">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Tax & Compliance</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Configure GST rates, HSN codes, and e-invoicing.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>
        <Link href="/dashboard/settings/document-numbering">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Document Numbering</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Configure auto-generation templates for invoices, customers, and more.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>

        <Link href="/dashboard/settings/payment-accounts">
          <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
            <AppCardHeader>
              <AppCardTitle>Payment Accounts</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="text-muted-foreground text-sm">
                Manage your payment accounts, banks, and UPI configurations.
              </p>
            </AppCardContent>
          </AppCard>
        </Link>
      </div>

      <div className="mt-8">
        <SectionHeader
          title="HR & Employee Masters"
          description="Configure employment types, departments, and employee-related master data."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/dashboard/settings/employee-types">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Employee Types</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">
                  Manage types of employment like Permanent, Contract, etc.
                </p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/departments">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Departments</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">Manage organizational departments.</p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/designations">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Designations</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">Manage job titles and designations.</p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/work-locations">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Work Locations</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">
                  Manage branch offices and work locations.
                </p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/employee-expense-types">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Employee Expense Types</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">
                  Manage categories for employee expenses and ledger mapping.
                </p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/leave-types">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Leave Types</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">
                  Manage categories for employee leaves (Sick, Casual, etc.).
                </p>
              </AppCardContent>
            </AppCard>
          </Link>

          <Link href="/dashboard/settings/holidays">
            <AppCard className="hover:border-primary/50 h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>Holidays</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <p className="text-muted-foreground text-sm">
                  Manage company holidays and observances.
                </p>
              </AppCardContent>
            </AppCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
