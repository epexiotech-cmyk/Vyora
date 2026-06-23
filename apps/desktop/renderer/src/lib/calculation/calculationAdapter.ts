import { CalculationEngineInput, InvoiceCalculationResult } from '@vyora/types';
import { moneyToPaise } from '@vyora/utils';
import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useDebounce } from '@/hooks/useDebounce';

// Shared type for UI form lines across Sales and Purchases
export interface UiInvoiceLine {
  quantity?: number | string;
  rate?: number | string;
  // Sales uses discountPercent, Purchases uses discountAmount
  discountPercent?: number | string;
  discountAmount?: number | string;
  // Sales uses taxPercent, Purchases might use _uiTaxPercentage
  taxPercent?: number | string;
  _uiTaxPercentage?: number | string;
}

const defaultTotals: InvoiceCalculationResult = {
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  roundOffAmount: 0,
  grandTotal: 0,
  items: [],
};

/**
 * Converts generic UI line items into the Engine's expected format (Paise).
 */
export function mapLinesToEngineInput(
  lines: UiInvoiceLine[],
  type: 'sales' | 'purchase',
): CalculationEngineInput {
  const items = lines.map((line) => {
    const qty = Number(line.quantity) || 0;
    const ratePaise = moneyToPaise(Number(line.rate) || 0);

    let discountPaise = 0;
    if (type === 'sales') {
      const discPct = Number(line.discountPercent) || 0;
      const gross = qty * ratePaise;
      discountPaise = gross * (discPct / 100);
    } else {
      discountPaise = moneyToPaise(Number(line.discountAmount) || 0);
    }

    const taxRate = Number(line.taxPercent) || Number(line._uiTaxPercentage) || 0;

    return {
      quantity: qty,
      rate: ratePaise,
      discountAmount: discountPaise,
      taxRate,
    };
  });

  return { items };
}

/**
 * Hook to automatically compute totals as the user types.
 * Debounces the input and uses the IPC calculation engine.
 */
export function useAsyncInvoiceCalculation(type: 'sales' | 'purchase') {
  const { control } = useFormContext();
  const watchedLines = useWatch({ control, name: 'lines' }) as UiInvoiceLine[];

  const [totals, setTotals] = useState<InvoiceCalculationResult>(defaultTotals);
  const [isCalculating, setIsCalculating] = useState(false);

  // Deeply simplify lines to a string for debouncing to prevent excessive renders/calls
  const stringifiedLines = JSON.stringify(
    (watchedLines || []).map((l) => ({
      q: Number(l.quantity) || 0,
      r: Number(l.rate) || 0,
      da: Number(l.discountAmount) || 0,
      dp: Number(l.discountPercent) || 0,
      tp: Number(l.taxPercent || l._uiTaxPercentage) || 0,
    })),
  );

  const debouncedStringifiedLines = useDebounce(stringifiedLines, 400);

  useEffect(() => {
    let isMounted = true;

    async function performCalculation() {
      if (!debouncedStringifiedLines || debouncedStringifiedLines === '[]') {
        if (isMounted) setTotals(defaultTotals);
        return;
      }

      try {
        setIsCalculating(true);
        // We use the raw watched lines instead of parsed, because they have the same shape
        const input = mapLinesToEngineInput(watchedLines || [], type);

        const res = await window.vyora.calculation.calculateInvoice(input);

        if (isMounted && res && res.success && res.data) {
          setTotals(res.data);
        }
      } catch (err) {
        console.error('Calculation engine error:', err);
        if (isMounted) setTotals(defaultTotals);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    }

    performCalculation();

    return () => {
      isMounted = false;
    };
  }, [debouncedStringifiedLines, type]); // Only run when the simplified state changes

  return { totals, isCalculating };
}
