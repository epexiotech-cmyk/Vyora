import { InvoiceCalculationResult } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppCard } from '@/components/ui/AppCard';
import { cn } from '@/lib/utils';

interface PurchaseTotalsCardProps {
  className?: string;
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
}

export function PurchaseTotalsCard({ className, calculationState }: PurchaseTotalsCardProps) {
  const { context } = useCompanyContext();
  const { totals, isCalculating } = calculationState || {
    totals: {
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      roundOffAmount: 0,
      grandTotal: 0,
      items: [],
    },
    isCalculating: false,
  };

  return (
    <AppCard className={cn('p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">Invoice Totals</h3>
        {isCalculating && (
          <span className="text-muted-foreground animate-pulse text-xs">Calculating...</span>
        )}
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotal, context?.currency)}</span>
        </div>

        {totals.totalDiscount > 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Discount (Sum of line discounts)</span>
            <span className="text-destructive">
              {formatMoney(-totals.totalDiscount, context?.currency)}
            </span>
          </div>
        )}

        <div className="text-muted-foreground flex items-center justify-between">
          <span>Tax Total</span>
          <span>{formatMoney(totals.totalTax, context?.currency)}</span>
        </div>

        {totals.roundOffAmount !== 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Round Off</span>
            <span>
              {totals.roundOffAmount > 0 ? '+' : ''}
              {formatMoney(totals.roundOffAmount, context?.currency)}
            </span>
          </div>
        )}

        <div className="bg-muted/30 border-border/40 mt-4 rounded-lg border p-4">
          <div className="text-foreground flex items-center justify-between text-2xl font-bold tracking-tight">
            <span>Grand Total</span>
            <span>{formatMoney(totals.grandTotal, context?.currency)}</span>
          </div>
        </div>
      </div>
    </AppCard>
  );
}
