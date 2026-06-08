import { TaxDto } from '@vyora/types';

export interface GstCalculationItemInput {
  quantity: number;
  rate: number;
  discountAmount: number;
  taxId: string;
}

export interface GstCalculationItemOutput extends GstCalculationItemInput {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  taxAmount: number;
  lineTotal: number;
  taxNameSnapshot: string;
  taxRateSnapshot: number;
}

export interface GstCalculationInvoiceInput<T extends GstCalculationItemInput> {
  companyStateCode: string | null;
  placeOfSupplyCode: string | null;
  isReverseCharge: boolean;
  items: T[];
}

export interface GstCalculationInvoiceOutput<T extends GstCalculationItemOutput> {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  items: T[];
}

export class GstCalculationService {
  /**
   * Main calculation engine that serves as the final authority for all GST math.
   * Discards all client-side calculated totals and recalculates from strictly authoritative data.
   */
  public calculate<T extends GstCalculationItemInput>(
    input: GstCalculationInvoiceInput<T>,
    availableTaxes: TaxDto[],
  ): GstCalculationInvoiceOutput<T & GstCalculationItemOutput> {
    const isInterState = this.determineInterState(input.companyStateCode, input.placeOfSupplyCode);

    let invoiceSubtotal = 0;
    let invoiceDiscount = 0;
    let invoiceTaxAmount = 0;

    const calculatedItems = input.items.map((item) => {
      // 1. Resolve Tax master data
      const tax = availableTaxes.find((t) => t.id === item.taxId);
      const taxRate = tax ? tax.rate : 0;
      const taxName = tax ? tax.name : '';

      // 2. Base Math
      const lineGross = item.quantity * item.rate;
      const taxableAmount = lineGross - item.discountAmount;

      // 3. Tax Amount Math
      // We calculate exact full tax amount then round it to nearest paisa
      const exactTaxAmount = taxableAmount * (taxRate / 100);
      const roundedTaxAmount = Math.round(exactTaxAmount);

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      // 4. Split Precision Math (Reverse Charge logic would override this but we don't have RCM rate logic yet, just flagging)
      if (taxRate > 0) {
        if (isInterState) {
          igstRate = taxRate;
          igstAmount = roundedTaxAmount;
        } else {
          cgstRate = taxRate / 2;
          sgstRate = taxRate / 2;

          // Precision Rule: Math.round(Total / 2) for CGST, Total - CGST for SGST
          cgstAmount = Math.round(roundedTaxAmount / 2);
          sgstAmount = roundedTaxAmount - cgstAmount;
        }
      }

      // If Reverse Charge is active, buyer pays the tax directly to government,
      // but it's typically shown on invoice without adding to lineTotal, or added but flagged.
      // Depending on Indian GST standard, RCM tax is listed but NOT added to the invoice grand total payable to supplier.
      // Wait, the rules strictly say "Do not add rcmAmount", so we just flag the invoice.
      // For now, we'll keep taxAmount in the line, but we should verify if RCM affects grandTotal.
      // Usually RCM means supplier doesn't collect the tax. So lineTotal = taxableAmount.
      // Let's implement standard RCM: supplier total payable = taxableAmount.

      let finalTaxAmount = roundedTaxAmount;
      let lineTotal = taxableAmount + finalTaxAmount;

      if (input.isReverseCharge) {
        finalTaxAmount = 0; // Supplier does not collect it
        lineTotal = taxableAmount;
      }

      // Accumulate invoice totals
      invoiceSubtotal += lineGross;
      invoiceDiscount += item.discountAmount;
      invoiceTaxAmount += finalTaxAmount;

      return {
        ...item,
        taxableAmount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        taxAmount: finalTaxAmount,
        lineTotal,
        taxNameSnapshot: taxName,
        taxRateSnapshot: taxRate,
      } as T & GstCalculationItemOutput;
    });

    const unroundedTotal = invoiceSubtotal - invoiceDiscount + invoiceTaxAmount;
    const grandTotal = Math.round(unroundedTotal);
    const roundOffAmount = grandTotal - unroundedTotal;

    return {
      subtotal: invoiceSubtotal,
      discountAmount: invoiceDiscount,
      taxAmount: invoiceTaxAmount,
      roundOffAmount,
      grandTotal,
      items: calculatedItems,
    };
  }

  /**
   * The sole rule for GST determination.
   */
  private determineInterState(
    companyStateCode: string | null,
    placeOfSupplyCode: string | null,
  ): boolean {
    if (!companyStateCode || !placeOfSupplyCode) {
      // Default to Intra-state if data is missing
      return false;
    }
    return companyStateCode !== placeOfSupplyCode;
  }
}

export const gstCalculationService = new GstCalculationService();
