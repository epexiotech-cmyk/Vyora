import { moneyToPaise } from '@vyora/utils';

export interface PurchaseLineUi {
  quantity: number;
  rate: number;
  discountAmount: number;
  _uiTaxPercentage: number;
}

export function calculatePurchaseLine(line: Partial<PurchaseLineUi>) {
  const qty = Number(line?.quantity) || 0;
  const rate = Number(line?.rate) || 0;
  const discAmt = Number(line?.discountAmount) || 0;
  const taxPct = Number(line?._uiTaxPercentage) || 0;

  const paiseRate = moneyToPaise(rate);
  const paiseDiscount = moneyToPaise(discAmt);

  const lineGross = qty * paiseRate;
  const lineTaxable = Math.max(0, lineGross - paiseDiscount);
  const lineTax = Math.round(lineTaxable * (taxPct / 100));
  const lineTotal = lineTaxable + lineTax;

  return {
    qty,
    rate,
    discAmt,
    taxPct,
    paiseRate,
    paiseDiscount,
    lineGross,
    lineTaxable,
    lineTax,
    lineTotal,
  };
}

export function calculatePurchaseTotals<T extends PurchaseLineUi>(lines: T[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;
  let taxTotal = 0;

  const items = lines.map((line) => {
    const computed = calculatePurchaseLine(line);

    subtotal += computed.lineGross;
    discountTotal += computed.paiseDiscount;
    taxableAmount += computed.lineTaxable;
    taxTotal += computed.lineTax;

    return {
      ...line, // Keep original values
      paiseRate: computed.paiseRate,
      paiseDiscount: computed.paiseDiscount,
      lineGross: computed.lineGross,
      lineTaxable: computed.lineTaxable,
      lineTax: computed.lineTax,
      lineTotal: computed.lineTotal,
    };
  });

  const unroundedTotal = taxableAmount + taxTotal;
  const grandTotal = Math.round(unroundedTotal);
  const roundOffAmount = grandTotal - unroundedTotal;

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    taxTotal,
    roundOffAmount,
    grandTotal,
    items,
  };
}
