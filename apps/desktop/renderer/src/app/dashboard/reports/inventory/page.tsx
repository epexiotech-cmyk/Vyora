import Link from 'next/link';

import { AppCard, AppCardHeader, AppCardTitle, AppCardContent } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function InventoryReportsIndex() {
  const reports = [
    {
      title: 'Stock Summary',
      description: 'View consolidated stock balances and valuation for all items.',
      href: '/dashboard/reports/inventory/stock-summary',
      isComingSoon: false,
    },
    {
      title: 'Stock Ledger',
      description: 'View detailed movement and running balance for a specific item.',
      href: '/dashboard/reports/inventory/stock-ledger',
      isComingSoon: false,
    },
    {
      title: 'Stock Movement Register',
      description: 'View a chronological register of all inventory movements.',
      href: '/dashboard/reports/inventory/movement-register',
      isComingSoon: false,
    },
    {
      title: 'Inventory Valuation',
      description: 'Detailed financial valuation of current inventory.',
      href: '#',
      isComingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inventory Reports"
        description="Comprehensive reports for inventory management."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className={report.isComingSoon ? 'pointer-events-none opacity-60' : ''}
          >
            <AppCard className="hover:border-primary h-full cursor-pointer transition-colors">
              <AppCardHeader>
                <AppCardTitle>{report.title}</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <div className="text-muted-foreground text-sm">{report.description}</div>
                {report.isComingSoon && (
                  <div className="text-muted-foreground mt-4 text-xs font-semibold tracking-wider uppercase">
                    Coming Soon
                  </div>
                )}
              </AppCardContent>
            </AppCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
