'use client';

import Link from 'next/link';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';

export default function SalesInvoicesPage() {
  return (
    <div className="bg-background flex h-full flex-col space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Invoices</h1>
        <Link href="/sales/invoices/new">
          <AppButton variant="default">New Invoice</AppButton>
        </Link>
      </div>

      <div className="bg-card text-muted-foreground flex flex-1 items-center justify-center rounded-md border p-8 text-center shadow-sm">
        <div className="space-y-2">
          <p>Invoice list view architecture implemented.</p>
          <p className="text-sm">Data table component will be mounted here in future iteration.</p>
        </div>
      </div>
    </div>
  );
}
