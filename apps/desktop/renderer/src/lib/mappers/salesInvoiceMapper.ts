import { CreateSalesInvoiceInput, CreateSalesInvoiceItemInput } from '@vyora/types';

export interface UiLineItem {
  productId?: string | null;
  productName?: string;
  qty?: number | string;
  rate?: number | string;
  discountPercent?: number | string;
  taxPercent?: number | string;
  amount?: number | string;
  unitId?: string | null;
  taxId?: string | null;
  hsnCode?: string | null;
}

export interface UiSalesInvoiceState {
  customer?: string;
  customerGstin?: string;
  customerAddress?: string;
  billingName?: string;
  billingGstin?: string;
  billingAddress?: string;
  billingCity?: string;
  billingDistrict?: string;
  billingStateCode?: string;
  billingStateName?: string;
  billingPincode?: string;
  shippingSameAsBilling?: boolean;
  shippingName?: string;
  shippingGstin?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingStateCode?: string;
  shippingStateName?: string;
  shippingPincode?: string;
  placeOfSupplyCode?: string;
  invoiceDate?: Date | string;
  referenceNumber?: string;
  lines?: UiLineItem[];
}

export function mapSalesInvoiceUiToDto(
  uiState: UiSalesInvoiceState,
  company: import('@vyora/types').CompanyProfileDto,
  financialYearId: string,
  calculationResult: import('@vyora/types').InvoiceCalculationResult,
  engineInput: import('@vyora/types').CalculationEngineInput,
): CreateSalesInvoiceInput {
  const customerStateCode = uiState.shippingStateCode || uiState.billingStateCode;
  const isInterState =
    customerStateCode && company.stateCode && customerStateCode !== company.stateCode;

  const items: CreateSalesInvoiceItemInput[] = (uiState.lines || [])
    .filter((line: UiLineItem) => line.productId && Number(line.qty) > 0)
    .map((line: UiLineItem, index: number) => {
      const engineLine = calculationResult.items[index];
      const inputLine = engineInput.items[index];

      const taxRate = Number(line.taxPercent) || 0;
      const taxAmount = engineLine ? engineLine.taxAmount : 0;

      let cgstRateSnapshot = 0;
      let sgstRateSnapshot = 0;
      let igstRateSnapshot = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (taxRate > 0) {
        if (isInterState) {
          igstRateSnapshot = taxRate;
          igstAmount = taxAmount;
        } else {
          cgstRateSnapshot = taxRate / 2;
          sgstRateSnapshot = taxRate / 2;
          // Simple split, handling odd amounts by adding the remainder to CGST
          sgstAmount = Math.floor(taxAmount / 2);
          cgstAmount = taxAmount - sgstAmount;
        }
      }

      return {
        productId: line.productId || '',
        unitId: line.unitId || '',
        taxId: line.taxId || '',
        description: line.productName,
        hsnCode: line.hsnCode || '',
        quantity: inputLine ? inputLine.quantity : Number(line.qty) || 0,
        rate: inputLine ? inputLine.rate : 0,
        discountAmount: inputLine ? inputLine.discountAmount : 0,
        taxableAmount: engineLine ? engineLine.taxableAmount : 0,
        taxAmount,

        taxRateSnapshot: taxRate,

        cgstRateSnapshot,
        sgstRateSnapshot,
        igstRateSnapshot,
        cessRateSnapshot: 0,

        cgstAmount,
        sgstAmount,
        igstAmount,
        cessAmount: 0,

        lineTotal: engineLine ? engineLine.lineTotal : 0,
      };
    });

  return {
    companyId: company.id,
    financialYearId,
    customerId: uiState.customer || '',
    invoiceDate: uiState.invoiceDate ? new Date(uiState.invoiceDate) : new Date(),
    isReverseCharge: false,
    subtotal: calculationResult.subtotal,
    discountAmount: calculationResult.totalDiscount,
    taxAmount: calculationResult.totalTax,
    roundOffAmount: calculationResult.roundOffAmount,
    grandTotal: calculationResult.grandTotal,
    notes: uiState.referenceNumber || null,
    status: 'DRAFT',

    companyNameSnapshot: company.legalName,
    companyAddressSnapshot: [
      company.addressLine1,
      company.addressLine2,
      company.city,
      company.stateCode,
      company.pincode,
    ]
      .filter(Boolean)
      .join(', '),
    companyGstinSnapshot: company.gstin || null,
    companyStateNameSnapshot: null, // No stateName in Dto
    companyStateCodeSnapshot: company.stateCode || null,
    companyPanSnapshot: company.pan || null,

    placeOfSupplyCode: uiState.placeOfSupplyCode || null,

    billingName: uiState.billingName || null,
    billingAddress: uiState.billingAddress || null,
    billingCity: uiState.billingCity || null,
    billingDistrict: uiState.billingDistrict || null,
    billingPincode: uiState.billingPincode || null,
    billingGstin: uiState.billingGstin || null,
    billingStateCode: uiState.billingStateCode || null,

    shippingName: uiState.shippingName || null,
    shippingAddress: uiState.shippingAddress || null,
    shippingCity: uiState.shippingCity || null,
    shippingDistrict: uiState.shippingDistrict || null,
    shippingPincode: uiState.shippingPincode || null,
    shippingGstin: uiState.shippingGstin || null,
    shippingStateCode: uiState.shippingStateCode || null,

    items,
  };
}
