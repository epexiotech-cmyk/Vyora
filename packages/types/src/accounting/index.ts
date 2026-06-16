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
