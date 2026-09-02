import { z } from 'zod';

export const SettlementTypeSchema = z.enum(['RECEIPT', 'PAYMENT']);
export type SettlementType = z.infer<typeof SettlementTypeSchema>;

export const SettlementPartyTypeSchema = z.enum(['CUSTOMER', 'SUPPLIER']);
export type SettlementPartyType = z.infer<typeof SettlementPartyTypeSchema>;

export const AllocationDocumentTypeSchema = z.enum([
  'SALES_INVOICE',
  'PURCHASE_BILL',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'OPENING_BALANCE',
]);
export type AllocationDocumentType = z.infer<typeof AllocationDocumentTypeSchema>;

export const SettlementStatusSchema = z.enum(['DRAFT', 'COMPLETED', 'CANCELLED']);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

export const SettlementAllocationSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  settlementId: z.string().uuid(),
  documentType: AllocationDocumentTypeSchema,
  documentId: z.string().uuid(),
  allocatedAmount: z.number().int().min(0),
  allocationDate: z.date(),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  // Joined Fields
  documentNumber: z.string().optional(),
  documentDate: z.date().optional(),
  documentTotal: z.number().int().optional(),
  documentBalance: z.number().int().optional(),
});

export type SettlementAllocationDto = z.infer<typeof SettlementAllocationSchema>;

export const SettlementSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  financialYearId: z.string().uuid(),
  settlementType: SettlementTypeSchema,
  partyType: SettlementPartyTypeSchema,
  partyId: z.string().uuid(),
  settlementNumber: z.string(),
  settlementDate: z.date(),
  amount: z.number().int().min(0),
  allocatedAmount: z.number().int().min(0),
  unallocatedAmount: z.number().int().min(0),
  paymentMode: z.string(),
  bankLedgerId: z.string().uuid(),
  referenceNumber: z.string().optional().nullable(),
  referenceDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: SettlementStatusSchema,
  isFrozen: z.boolean().default(false),
  syncVersion: z.number().int().default(1),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),

  allocations: z.array(SettlementAllocationSchema).optional(),
  // Joined Fields
  partyName: z.string().optional(),
  paymentAccountName: z.string().optional(),
});

export type SettlementDto = z.infer<typeof SettlementSchema>;

export const CreateSettlementAllocationInputSchema = z.object({
  documentType: AllocationDocumentTypeSchema,
  documentId: z.string().uuid(),
  allocatedAmount: z.number().int().positive(),
});

export type CreateSettlementAllocationInput = z.infer<typeof CreateSettlementAllocationInputSchema>;

export const CreateSettlementInputSchema = z.object({
  settlementDate: z.date(),
  partyType: SettlementPartyTypeSchema,
  partyId: z.string().uuid(),
  amount: z.number().int().positive(),
  paymentMode: z.string(),
  paymentAccountId: z.string().uuid(),
  referenceNumber: z.string().optional().nullable(),
  referenceDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  allocations: z
    .array(CreateSettlementAllocationInputSchema)
    .min(1, 'At least one allocation is required'),
});

export type CreateSettlementInput = z.infer<typeof CreateSettlementInputSchema>;

export const UpdateSettlementInputSchema = z.object({
  settlementId: z.string().uuid(),
  settlementDate: z.date(),
  amount: z.number().int().positive(),
  paymentAccountId: z.string().uuid(),
  referenceNumber: z.string().optional().nullable(),
  referenceDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  allocations: z
    .array(CreateSettlementAllocationInputSchema)
    .min(1, 'At least one allocation is required'),
});

export type UpdateSettlementInput = z.infer<typeof UpdateSettlementInputSchema>;

export const RecordPaymentInputSchema = z.object({
  amount: z.number().int().positive(),
  paymentDate: z.date(),
  paymentMode: z.string(),
  paymentAccountId: z.string().uuid(),
  referenceNumber: z.string().optional().nullable(),
  referenceDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>;

export interface ListSettlementsOptions {
  type: SettlementType;
  companyId?: string;
  financialYearId?: string;
  limit?: number;
  offset?: number;
}

export const SettlementListRowSchema = SettlementSchema.extend({
  partyName: z.string(),
  paymentAccountName: z.string(),
});

export type SettlementListRowDto = z.infer<typeof SettlementListRowSchema>;

export const SettlementListSchema = z.object({
  data: z.array(SettlementListRowSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type SettlementListDto = z.infer<typeof SettlementListSchema>;

export const OutstandingDocumentSchema = z.object({
  id: z.string().uuid(),
  documentNumber: z.string(),
  documentDate: z.date(),
  grandTotal: z.number().int().min(0),
  balanceDue: z.number().int().min(0),
  status: z.string(),
  documentType: AllocationDocumentTypeSchema,
});

export type OutstandingDocumentDto = z.infer<typeof OutstandingDocumentSchema>;
