import { z } from 'zod';

// ==========================================
// Base Enums & Constants
// ==========================================

export const PurchaseStatus = z.enum(['DRAFT', 'COMPLETED', 'CANCELLED']);
export type PurchaseStatus = z.infer<typeof PurchaseStatus>;

// ==========================================
// Nested Line Schemas
// ==========================================

export const purchaseLineSchema = z.object({
  id: z.string().uuid(),
  purchaseInvoiceId: z.string().uuid(),
  productId: z.string().uuid(),
  itemName: z.string().min(1, 'Item name is required'),
  itemCode: z.string().nullable().optional(),
  unitId: z.string().uuid(),
  unitShortName: z.string().min(1, 'Unit short name is required'),
  taxId: z.string().uuid(),
  taxPercentage: z.number().min(0).max(100),
  hsnCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  rate: z.number().int().min(0, 'Rate cannot be negative'),
  discountAmount: z.number().int().min(0).default(0),
  taxableAmount: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  lineTotal: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  syncVersion: z.number().int(),
});

export type PurchaseLineDto = z.infer<typeof purchaseLineSchema>;

export const createPurchaseLineSchema = purchaseLineSchema.omit({
  id: true,
  purchaseInvoiceId: true,
  itemName: true,
  itemCode: true,
  unitShortName: true,
  taxPercentage: true,
  hsnCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  syncVersion: true,
});

export type CreatePurchaseLineInput = z.infer<typeof createPurchaseLineSchema>;

export const updatePurchaseLineSchema = createPurchaseLineSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export type UpdatePurchaseLineInput = z.infer<typeof updatePurchaseLineSchema>;

// ==========================================
// Header Schemas
// ==========================================

export const purchaseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  financialYearId: z.string().uuid(),
  purchaseNumber: z.string().min(1, 'Purchase number is required'),
  purchaseDate: z.date(),
  supplierId: z.string().uuid(),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierGstin: z.string().nullable().optional(),
  supplierInvoiceNumber: z.string().nullable().optional(),
  supplierInvoiceDate: z.date().nullable().optional(),
  subtotal: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  taxAmount: z.number().int().min(0),
  roundOffAmount: z.number().int().default(0),
  grandTotal: z.number().int().min(0),
  notes: z.string().nullable().optional(),
  status: PurchaseStatus,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
  syncVersion: z.number().int(),
  lines: z.array(purchaseLineSchema),
});

export type PurchaseDto = z.infer<typeof purchaseSchema>;

export const createPurchaseSchema = purchaseSchema
  .omit({
    id: true,
    companyId: true,
    purchaseNumber: true,
    supplierName: true,
    supplierGstin: true,
    status: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    syncVersion: true,
    lines: true,
  })
  .extend({
    status: PurchaseStatus.optional(),
    lines: z.array(createPurchaseLineSchema).min(1, 'At least one line item is required'),
  });

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const updatePurchaseSchema = createPurchaseSchema.partial().extend({
  id: z.string().uuid(),
  status: PurchaseStatus.optional(),
  lines: z.array(updatePurchaseLineSchema).optional(),
});

export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;

// ==========================================
// Search Options
// ==========================================

export const searchPurchasesSchema = z.object({
  query: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  status: PurchaseStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchPurchasesOptions = z.infer<typeof searchPurchasesSchema>;

export const purchaseListRowSchema = z.object({
  id: z.string().uuid(),
  purchaseNumber: z.string(),
  purchaseDate: z.date(),
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  supplierInvoiceNumber: z.string().nullable().optional(),
  grandTotal: z.number().int().min(0),
  status: PurchaseStatus,
  isActive: z.boolean(),
});

export type PurchaseListRowDto = z.infer<typeof purchaseListRowSchema>;

export const purchaseListSchema = z.object({
  data: z.array(purchaseListRowSchema),
  total: z.number().int().min(0),
});

export type PurchaseListDto = z.infer<typeof purchaseListSchema>;
