'use client';

import * as React from 'react';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function AccountBalanceSummaryPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Account Balance Summary"
        description="Overview of closing balances across all payment accounts"
      />
      <div className="text-muted-foreground text-sm">Select a date to view account balances.</div>
    </div>
  );
}
