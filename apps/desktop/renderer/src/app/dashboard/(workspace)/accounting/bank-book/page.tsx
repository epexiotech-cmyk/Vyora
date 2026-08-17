'use client';

import * as React from 'react';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function BankBookPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Bank Book" description="Transaction history for bank accounts" />
      <div className="text-muted-foreground text-sm">Select a bank account to view its ledger.</div>
    </div>
  );
}
