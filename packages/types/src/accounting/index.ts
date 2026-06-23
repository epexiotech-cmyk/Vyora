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

export interface LedgerLookupDto {
  id: string;
  name: string;
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

export interface VoucherListItemDto {
  id: string;
  voucherNumber: string;
  voucherType: string;
  voucherDate: Date;
  referenceType: string;
  referenceId?: string | null;
  narration?: string | null;
  isCancelled: boolean;
  totalAmount: number; // calculated from debit or credit total
}

export interface VoucherFilterDto {
  fromDate?: string | Date;
  toDate?: string | Date;
  voucherType?: string;
  searchQuery?: string;
}

export interface VoucherDetailDto extends VoucherDto {
  ledgerNames: Record<string, string>;
  totalDebit: number;
  totalCredit: number;
}

export interface TrialBalanceRowDto {
  ledgerId: string;
  ledgerName: string;
  debitTotal: number;
  creditTotal: number;
}

export interface TrialBalanceDto {
  rows: TrialBalanceRowDto[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface LedgerStatementRowDto {
  id: string;
  date: Date;
  voucherId: string;
  voucherNumber: string;
  voucherType: string;
  particulars: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  balanceType: 'Dr' | 'Cr';
}

export interface LedgerStatementDto {
  ledgerId: string;
  ledgerName: string;
  openingBalance: number;
  openingType: 'Dr' | 'Cr';
  rows: LedgerStatementRowDto[];
  closingBalance: number;
  closingType: 'Dr' | 'Cr';
}

export interface AccountingDashboardDto {
  totalVouchers: number;
  salesVoucherCount: number;
  purchaseVoucherCount: number;
}
