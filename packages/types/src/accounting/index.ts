import { z } from 'zod';

export const VoucherTypeEnum = [
  'Sales',
  'Purchase',
  'Receipt',
  'Payment',
  'Contra',
  'Journal',
  'CreditNote',
  'DebitNote',
] as const;

export const VoucherReferenceTypeEnum = [
  'SALES_INVOICE',
  'SALES_INVOICE_CANCELLATION',
  'PURCHASE_BILL',
  'PURCHASE_BILL_CANCELLATION',
  'PAYMENT',
  'RECEIPT',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'MANUAL',
] as const;

export const CreateVoucherEntrySchema = z.object({
  ledgerId: z.string().min(1, 'Ledger ID is required'),
  debitAmount: z.number().int().min(0, 'Debit amount must be positive integer paise'),
  creditAmount: z.number().int().min(0, 'Credit amount must be positive integer paise'),
  narration: z.string().optional().nullable(),
});

export const CreateVoucherInputSchema = z.object({
  voucherType: z.enum(VoucherTypeEnum),
  voucherNumber: z.string().min(1, 'Voucher Number is required'),
  voucherDate: z.union([z.string(), z.date()]),
  sourceModule: z.string().min(1, 'Source Module is required'),
  referenceType: z.enum(VoucherReferenceTypeEnum),
  referenceId: z.string().optional().nullable(),
  narration: z.string().optional().nullable(),
  entries: z.array(CreateVoucherEntrySchema).min(2, 'A voucher must have at least two entries'),
});

export type CreateVoucherEntryInput = z.infer<typeof CreateVoucherEntrySchema>;
export type CreateVoucherInput = z.infer<typeof CreateVoucherInputSchema>;

export interface CalculationLineInput {
  quantity: number;
  rate: number;
  discountAmount: number;
  taxRate: number;
}

export interface CalculationEngineInput {
  items: Array<CalculationLineInput>;
  headerDiscountAmount?: number;
}

export interface LineCalculationResult {
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  roundOffAmount: number;
  grandTotal: number;
  items: LineCalculationResult[];
}

export interface VoucherEntryDto {
  id: string;
  voucherId: string;
  lineNumber: number;
  ledgerId: string;
  debitAmount: number;
  creditAmount: number;
  entryDate: Date;
  narration?: string | null;
  syncVersion: number;
  createdAt: Date;
}

export interface VoucherDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  financialYearId: string;
  voucherType: string;
  voucherNumber: string;
  voucherDate: Date;
  sourceModule: string;
  referenceType: string;
  referenceId?: string | null;
  reversalVoucherId?: string | null;
  narration?: string | null;
  isCancelled: boolean;
  isFrozen: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  entries?: VoucherEntryDto[];
}

export interface LedgerDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  groupId: string;
  name: string;
  referenceType: string;
  referenceId?: string | null;
  isSystemAccount: boolean;
  allowManualPosting: boolean;
  isFrozen: boolean;
  openingBalance: number;
  openingType: 'Dr' | 'Cr';
  notes?: string | null;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface LedgerGroupDto {
  id: string;
  companyId: string;
  name: string;
  parentGroupId?: string | null;
  nature: string;
  isSystemGroup: boolean;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
