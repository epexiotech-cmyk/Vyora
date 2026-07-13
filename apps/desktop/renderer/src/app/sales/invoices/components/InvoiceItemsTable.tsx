'use client';

import type { InvoiceCalculationResult } from '@vyora/types';
import * as React from 'react';

import { InvoiceLineGrid } from '@/components/forms/InvoiceLineGrid';

export function InvoiceItemsTable({
  calculationState,
  isReadOnly,
}: {
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
  isReadOnly?: boolean;
}) {
  return (
    <div className="bg-background overflow-hidden rounded-md border">
      <div className="bg-muted/20 border-b p-3">
        <h2 className="text-lg font-semibold">Items</h2>
      </div>
      <InvoiceLineGrid calculationState={calculationState} isReadOnly={isReadOnly} />
    </div>
  );
}
