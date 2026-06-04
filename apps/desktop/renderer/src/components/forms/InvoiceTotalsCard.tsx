import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { AppCard } from '@/components/ui/AppCard';
import { cn } from '@/lib/utils';

interface InvoiceTotalsCardProps {
  className?: string;
}

export function useInvoiceTotals() {
  const { control } = useFormContext();
  const watchedLines = useWatch({ control, name: 'lines' });

  return React.useMemo(() => {
    const lines = watchedLines || [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxableAmount = 0;
    let taxTotal = 0;

    for (const line of lines) {
      const qty = Number(line?.qty) || 0;
      const rate = Number(line?.rate) || 0;
      const discPct = Number(line?.discountPercent) || 0;
      const taxPct = Number(line?.taxPercent) || 0;

      // Line Gross
      const lineGross = qty * rate;
      // Line Discount
      const lineDisc = lineGross * (discPct / 100);
      // Taxable Amount
      const lineTaxable = lineGross - lineDisc;
      // Tax
      const lineTax = lineTaxable * (taxPct / 100);

      subtotal += lineGross;
      discountTotal += lineDisc;
      taxableAmount += lineTaxable;
      taxTotal += lineTax;
    }

    const unroundedTotal = taxableAmount + taxTotal;
    const grandTotal = Math.round(unroundedTotal);
    const roundOff = grandTotal - unroundedTotal;

    return {
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      roundOff,
      grandTotal,
    };
  }, [watchedLines]);
}

export function InvoiceTotalsCard({ className }: InvoiceTotalsCardProps) {
  const totals = useInvoiceTotals();

  return (
    <AppCard className={cn('p-5', className)}>
      <h3 className="text-foreground mb-4 text-sm font-semibold">Totals</h3>

      <div className="flex flex-col gap-3 text-sm">
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Subtotal</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>

        {totals.discountTotal > 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Discount</span>
            <span className="text-destructive">-₹{totals.discountTotal.toFixed(2)}</span>
          </div>
        )}

        {/* Future Extension Point for GST Breakdown */}
        {/*
        {isGstEnabled && (
          <>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>CGST</span>
              <span>₹{totals.cgstTotal.toFixed(2)}</span>
            </div>
            ...
          </>
        )}
        */}
        <div className="text-muted-foreground flex items-center justify-between">
          <span>Tax Total</span>
          <span>₹{totals.taxTotal.toFixed(2)}</span>
        </div>

        {totals.roundOff !== 0 && (
          <div className="text-muted-foreground flex items-center justify-between">
            <span>Round Off</span>
            <span>
              {totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff.toFixed(2)}
            </span>
          </div>
        )}

        <div className="border-border/50 my-2 border-b"></div>

        <div className="text-foreground flex items-center justify-between text-base font-semibold">
          <span>Grand Total</span>
          <span className="text-lg">₹{totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </AppCard>
  );
}
