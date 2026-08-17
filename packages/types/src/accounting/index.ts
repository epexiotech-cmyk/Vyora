import { z } from 'zod';

export * from './financialOverview.dto';
export * from './payment-account.dto';

export const VoucherTypeEnum = [
  'Sales',
  'Purchase',
  'Receipt',
  'Payment',
  'Contra',
  'Journal',
  'CreditNote',
  'DebitNote',
  'OPENING_BALANCE',
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
  'PAYMENT_ACCOUNT_OPENING',
  'FUND_TRANSFER',
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

export interface CreateOpeningBalanceInput {
  paymentAccountId: string;
  amount: number;
  balanceType: 'Dr' | 'Cr';
  voucherDate: Date;
  notes?: string;
}

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
  totalVouchers?: number;
  salesVoucherCount?: number;
  purchaseVoucherCount?: number;
  totalLedgers: number;
  totalJournalEntries: number;
  trialBalanceStatus: { isBalanced: boolean; difference: number };
  currentProfitLoss: number;
  financialOverview: { date: Date; income: number; expense: number; netProfit: number }[];
  recentJournals: { id: string; date: Date; voucherNumber: string; amount: number }[];
  lastUpdatedAt: Date;
}

// -----------------------------------------------------------------------------
// LEDGER GROUPS
// -----------------------------------------------------------------------------
export const LedgerGroupNatureEnum = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'] as const;
export type LedgerGroupNature = (typeof LedgerGroupNatureEnum)[number];

export const createLedgerGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentGroupId: z.string().optional().nullable(),
  nature: z.enum(LedgerGroupNatureEnum),
  isActive: z.boolean().optional(),
});
export type CreateLedgerGroupInput = z.infer<typeof createLedgerGroupSchema>;

export const updateLedgerGroupSchema = createLedgerGroupSchema.partial();
export type UpdateLedgerGroupInput = z.infer<typeof updateLedgerGroupSchema>;

export interface SearchLedgerGroupsOptions {
  companyId?: string;
  query?: string;
  nature?: LedgerGroupNature;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export const searchLedgerGroupsSchema = z.any(); // placeholder

export interface LedgerGroupListDto {
  data: LedgerGroupDto[];
  total: number;
}

// -----------------------------------------------------------------------------
// LEDGERS
// -----------------------------------------------------------------------------
export const LedgerOpeningTypeEnum = ['Dr', 'Cr'] as const;
export type LedgerOpeningType = (typeof LedgerOpeningTypeEnum)[number];

export const createLedgerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  groupId: z.string().min(1, 'Group is required'),
  alias: z.string().optional().nullable(),
  openingBalance: z.number().optional().nullable(),
  openingType: z.enum(LedgerOpeningTypeEnum).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});
export type CreateLedgerInput = z.infer<typeof createLedgerSchema>;

export const updateLedgerSchema = createLedgerSchema.partial();
export type UpdateLedgerInput = z.infer<typeof updateLedgerSchema>;

export interface SearchLedgersOptions {
  companyId?: string;
  query?: string;
  groupId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}
export const searchLedgersSchema = z.any(); // placeholder

export interface LedgerListDto {
  data: LedgerDto[];
  total: number;
}

export * from './fund-transfer.dto';
