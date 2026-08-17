'use client';

import * as React from 'react';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function UpiBookPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="UPI Book" description="Transaction history for UPI accounts" />
      <div className="text-muted-foreground text-sm">Select a UPI account to view its ledger.</div>
    </div>
  );
}
