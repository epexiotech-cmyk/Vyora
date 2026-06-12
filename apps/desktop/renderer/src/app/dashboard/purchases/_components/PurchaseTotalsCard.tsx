import { paiseToMoney } from '@vyora/utils';
import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { calculatePurchaseTotals } from './purchase-calculations';

import { AppCard } from '@/components/ui/AppCard';
import { cn } from '@/lib/utils';

interface PurchaseTotalsCardProps {
  className?: string;
}

export function usePurchaseTotals() {
  const { control } = useFormContext();
  const watchedLines = useWatch({ control, name: 'lines' });

  return React.useMemo(() => {
    return calculatePurchaseTotals(watchedLines || []);
  }, [watchedLines]);
}

export function PurchaseTotalsCard({ className }: PurchaseTotalsCardProps) {
  const totals = usePurchaseTotals();

  return (
    <AppCard className={cn('p-5', className)}>
      <h3 className="text-foreground mb-4 text-sm font-semibold">Invoice Totals</h3>

      <div className="flex flex-col gap-3 text-sm">
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Subtotal</span>
          <span>₹{paiseToMoney(totals.subtotal).toFixed(2)}</span>
        </div>

        {totals.discountTotal > 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Discount (Sum of line discounts)</span>
            <span className="text-destructive">
              -₹{paiseToMoney(totals.discountTotal).toFixed(2)}
            </span>
          </div>
        )}

        <div className="text-muted-foreground flex items-center justify-between">
          <span>Tax Total</span>
          <span>₹{paiseToMoney(totals.taxTotal).toFixed(2)}</span>
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

        <div className="border-border/50 mt-2 border-t pt-3">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Grand Total</span>
            <span>₹{paiseToMoney(totals.grandTotal).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </AppCard>
  );
}
