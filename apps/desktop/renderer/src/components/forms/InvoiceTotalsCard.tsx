import { InvoiceCalculationResult } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppCard } from '@/components/ui/AppCard';
import { cn } from '@/lib/utils';

interface InvoiceTotalsCardProps {
  className?: string;
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
}

export function InvoiceTotalsCard({ className, calculationState }: InvoiceTotalsCardProps) {
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
        <h3 className="text-foreground text-sm font-semibold">Totals</h3>
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
            <span>Discount</span>
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

        <div className="border-border/50 my-2 border-b"></div>

        <div className="text-foreground flex items-center justify-between text-base font-semibold">
          <span>Grand Total</span>
          <span className="text-lg">{formatMoney(totals.grandTotal, context?.currency)}</span>
        </div>
      </div>
    </AppCard>
  );
}
