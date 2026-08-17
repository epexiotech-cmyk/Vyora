'use client';

import * as React from 'react';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function CashBookPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Cash Book" description="Transaction history for cash accounts" />
      <div className="text-muted-foreground text-sm">Select a cash account to view its ledger.</div>
    </div>
  );
}
