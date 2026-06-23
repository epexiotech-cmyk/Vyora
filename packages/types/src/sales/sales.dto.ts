import { z } from 'zod';

import { InvoiceStatus } from '../common/status.dto';

export const createSalesInvoiceItemSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  taxId: z.string().uuid(),
  description: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  rate: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  taxableAmount: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  lineTotal: z.number().int().min(0),
});

export type CreateSalesInvoiceItemInput = z.infer<typeof createSalesInvoiceItemSchema>;

export const createSalesInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  financialYearId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.date(),
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
  description?: string | null;
  hsnCode?: string | null;
  quantity: number;
  rate: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface SalesInvoiceDto {
  id: string;
  companyId: string;
  financialYearId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
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
  status: InvoiceStatus;
}

export interface ListSalesInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}
