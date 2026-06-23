import { InvoiceCalculationResult } from '@vyora/types';
import { paiseToMoney } from '@vyora/utils';
import * as React from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { cn } from '@/lib/utils';

interface InvoiceTotalsCardProps {
  className?: string;
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
}

export function InvoiceTotalsCard({ className, calculationState }: InvoiceTotalsCardProps) {
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
          <span>₹{paiseToMoney(totals.subtotal).toFixed(2)}</span>
        </div>

        {totals.totalDiscount > 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Discount</span>
            <span className="text-destructive">
              -₹{paiseToMoney(totals.totalDiscount).toFixed(2)}
            </span>
          </div>
        )}

        <div className="text-muted-foreground flex items-center justify-between">
          <span>Tax Total</span>
          <span>₹{paiseToMoney(totals.totalTax).toFixed(2)}</span>
        </div>

        {totals.roundOffAmount !== 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Round Off</span>
            <span>
              {totals.roundOffAmount > 0 ? '+' : ''}₹
              {paiseToMoney(totals.roundOffAmount).toFixed(2)}
            </span>
          </div>
        )}

        <div className="border-border/50 my-2 border-b"></div>

        <div className="text-foreground flex items-center justify-between text-base font-semibold">
          <span>Grand Total</span>
          <span className="text-lg">₹{paiseToMoney(totals.grandTotal).toFixed(2)}</span>
        </div>
      </div>
    </AppCard>
  );
}
