import { z } from 'zod';

import { InvoiceStatus } from '../common/status.dto';

export const createSalesInvoiceItemSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  taxId: z.string().uuid(),
  taxGroupId: z.string().uuid().optional().nullable(),
  taxGroupCodeSnapshot: z.string().optional().nullable(),
  taxGroupNameSnapshot: z.string().optional().nullable(),
  taxRateSnapshot: z.number().optional().nullable(),
  cgstRateSnapshot: z.number().optional().nullable(),
  sgstRateSnapshot: z.number().optional().nullable(),
  igstRateSnapshot: z.number().optional().nullable(),
  cessRateSnapshot: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  itemTypeSnapshot: z
    .enum(['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE'])
    .optional()
    .nullable(),
  quantity: z.number().int().min(1),
  rate: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  taxableAmount: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  cgstAmount: z.number().int().min(0).optional(),
  sgstAmount: z.number().int().min(0).optional(),
  igstAmount: z.number().int().min(0).optional(),
  cessAmount: z.number().int().min(0).optional(),
  lineTotal: z.number().int().min(0),
});

export type CreateSalesInvoiceItemInput = z.infer<typeof createSalesInvoiceItemSchema>;

export const createSalesInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  financialYearId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).optional().nullable(),
  invoiceDate: z.date(),
  placeOfSupplyStateId: z.string().uuid().optional().nullable(),
  isReverseCharge: z.boolean().default(false),

  // Snapshots for Printing
  companyNameSnapshot: z.string().optional().nullable(),
  companyAddressSnapshot: z.string().optional().nullable(),
  companyGstinSnapshot: z.string().optional().nullable(),
  companyStateNameSnapshot: z.string().optional().nullable(),
  companyStateCodeSnapshot: z.string().optional().nullable(),
  companyPanSnapshot: z.string().optional().nullable(),
  companyLogoPath: z.string().optional().nullable(),

  placeOfSupplyCode: z.string().optional().nullable(),

  billingName: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingDistrict: z.string().optional().nullable(),
  billingPincode: z.string().optional().nullable(),
  billingGstin: z.string().optional().nullable(),
  billingStateCode: z.string().optional().nullable(),

  shippingName: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingDistrict: z.string().optional().nullable(),
  shippingPincode: z.string().optional().nullable(),
  shippingGstin: z.string().optional().nullable(),
  shippingStateCode: z.string().optional().nullable(),

  paymentAccountId: z.string().uuid().optional().nullable(),
  bankNameSnapshot: z.string().optional().nullable(),
  accountNumberSnapshot: z.string().optional().nullable(),
  ifscCodeSnapshot: z.string().optional().nullable(),
  branchNameSnapshot: z.string().optional().nullable(),

  qrAccountId: z.string().uuid().optional().nullable(),
  upiIdSnapshot: z.string().optional().nullable(),
  upiPayeeNameSnapshot: z.string().optional().nullable(),

  signatureId: z.string().uuid().optional().nullable(),

  subtotal: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  taxAmount: z.number().int().min(0),
  roundOffAmount: z.number().int().default(0),
  grandTotal: z.number().int().min(0),
  notes: z.string().optional().nullable(),
  status: InvoiceStatus.optional(),
  items: z.array(createSalesInvoiceItemSchema).min(1),
});

export type CreateSalesInvoiceInput = z.infer<typeof createSalesInvoiceSchema>;

export const updateSalesInvoiceSchema = createSalesInvoiceSchema.partial();
export type UpdateSalesInvoiceInput = z.infer<typeof updateSalesInvoiceSchema>;

export interface SalesInvoiceLineDto {
  id: string;
  salesInvoiceId: string;
  productId: string;
  unitId: string;
  taxId: string;
  taxGroupId?: string | null;
  taxGroupCodeSnapshot?: string | null;
  taxGroupNameSnapshot?: string | null;
  taxRateSnapshot?: number | null;
  cgstRateSnapshot?: number | null;
  sgstRateSnapshot?: number | null;
  igstRateSnapshot?: number | null;
  cessRateSnapshot?: number | null;
  description?: string | null;
  hsnCode?: string | null;
  itemTypeSnapshot?: 'INVENTORY_ITEM' | 'NON_INVENTORY_ITEM' | 'SERVICE' | null;
  quantity: number;
  rate: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  lineTotal: number;
}

export interface SalesInvoiceDto {
  id: string;
  companyId: string;
  financialYearId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  placeOfSupplyStateId?: string | null;
  isReverseCharge?: boolean;

  // Snapshots for Printing
  companyNameSnapshot?: string | null;
  companyAddressSnapshot?: string | null;
  companyGstinSnapshot?: string | null;
  companyStateNameSnapshot?: string | null;
  companyStateCodeSnapshot?: string | null;
  companyPanSnapshot?: string | null;
  companyLogoPath?: string | null;

  placeOfSupplyCode?: string | null;

  billingName?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingDistrict?: string | null;
  billingPincode?: string | null;
  billingGstin?: string | null;
  billingStateCode?: string | null;

  shippingName?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  shippingPincode?: string | null;
  shippingGstin?: string | null;
  shippingStateCode?: string | null;

  paymentAccountId?: string | null;
  bankNameSnapshot?: string | null;
  accountNumberSnapshot?: string | null;
  ifscCodeSnapshot?: string | null;
  branchNameSnapshot?: string | null;

  qrAccountId?: string | null;
  upiIdSnapshot?: string | null;
  upiPayeeNameSnapshot?: string | null;

  signatureId?: string | null;

  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string | null;
  status: InvoiceStatus;
  createdAt: Date;
  items?: SalesInvoiceLineDto[];
}

export interface SalesInvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  grandTotal: number;
  amountPaid?: number;
  balanceDue?: number;
  status: InvoiceStatus;
}

export interface ListSalesInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  status?: InvoiceStatus;
  customerId?: string;
}

export interface SalesInvoiceListDto {
  data: SalesInvoiceDto[];
  total: number;
}
