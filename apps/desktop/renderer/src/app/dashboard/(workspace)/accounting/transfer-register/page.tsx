'use client';

import * as React from 'react';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function TransferRegisterPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transfer Register"
        description="Log of internal fund transfers between accounts"
      />
      <div className="text-muted-foreground text-sm">Select a date range to view transfers.</div>
    </div>
  );
}
