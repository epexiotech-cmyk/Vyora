// Phase 4.4B Foundation DTO

export interface CreatePurchaseInvoiceItemInput {
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

export interface CreatePurchaseInvoiceInput {
  companyId: string;
  financialYearId: string;
  supplierId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string | null;
  invoiceDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  notes?: string | null;
  status: string;
  items: CreatePurchaseInvoiceItemInput[];
}

export interface PurchaseInvoiceLineDto {
  id: string;
  purchaseInvoiceId: string;
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

export interface PurchaseInvoiceDto {
  id: string;
  companyId: string;
  financialYearId: string;
  supplierId: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string | null;
  invoiceDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  notes?: string | null;
  status: string;
  createdAt: Date;
  items?: PurchaseInvoiceLineDto[];
}

export interface PurchaseInvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  grandTotal: number;
  status: string;
}

export interface ListPurchaseInvoicesOptions {
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}
