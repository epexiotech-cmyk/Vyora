'use client';

import type { InvoiceCalculationResult } from '@vyora/types';
import * as React from 'react';

import { InvoiceTotalsCard } from '@/components/forms/InvoiceTotalsCard';

export function InvoiceTotals({
  calculationState,
}: {
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
}) {
  return (
    <div className="w-full">
      <InvoiceTotalsCard calculationState={calculationState} />
    </div>
  );
}
