// Phase 4.4B Foundation DTO

export interface CreateSalesInvoiceItemInput {
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

export interface CreateSalesInvoiceInput {
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
  status: string;
  items: CreateSalesInvoiceItemInput[];
}

export type UpdateSalesInvoiceInput = Partial<CreateSalesInvoiceInput>;

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
  status: string;
  createdAt: Date;
  items?: SalesInvoiceLineDto[];
}

export interface SalesInvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  grandTotal: number;
  status: string;
}

export interface ListSalesInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}
