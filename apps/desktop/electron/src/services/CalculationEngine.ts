import {
  CalculationEngineInput,
  InvoiceCalculationResult,
  LineCalculationResult,
} from '@vyora/types';

export class CalculationEngine {
  public static calculate(input: CalculationEngineInput): InvoiceCalculationResult {
    let subtotal = 0;
    let totalTax = 0;
    let itemsDiscount = 0;

    const lineResults: LineCalculationResult[] = [];

    for (const item of input.items) {
      // 1. Gross = quantity * rate
      const grossAmount = item.quantity * item.rate;

      // 2. Taxable = Gross - Line Discount
      const taxableAmount = Math.max(0, grossAmount - item.discountAmount);

      // 3. Tax = Round(Taxable * (TaxRate / 100)) to nearest integer since amounts are typically in paise/cents
      // For precision, Javascript does well enough with Math.round
      const taxAmount = Math.round(taxableAmount * (item.taxRate / 100));

      // 4. Line Total
      const lineTotal = taxableAmount + taxAmount;

      lineResults.push({
        taxableAmount,
        taxAmount,
        lineTotal,
      });

      subtotal += taxableAmount;
      totalTax += taxAmount;
      itemsDiscount += item.discountAmount;
    }

    const headerDiscount = input.headerDiscountAmount || 0;
    const totalDiscount = itemsDiscount + headerDiscount;

    // Apply header discount proportionally? Or just subtract from Grand Total before rounding?
    // Often header discounts are applied against the final amount. But if they reduce taxable amount, they need proportioning.
    // Assuming simple subtotal + tax for now. Since header discount wasn't originally separated from subtotal in schema.
    // The design document formula: TotalBeforeRound = Subtotal + TotalTax - HeaderDiscount
    // Wait, the design document says: TotalBeforeRound = Subtotal + TotalTax. Wait, no.
    // Subtotal already reduced by line discounts.
    const totalBeforeRound = subtotal + totalTax - headerDiscount;

    const grandTotal = Math.round(totalBeforeRound);
    const roundOffAmount = grandTotal - totalBeforeRound;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      roundOffAmount,
      grandTotal,
      items: lineResults,
    };
  }
}
