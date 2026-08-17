import { z } from 'zod';

export const TransferTypeEnum = [
  'BANK_TO_BANK',
  'BANK_TO_CASH',
  'CASH_TO_BANK',
  'BANK_TO_UPI',
  'UPI_TO_BANK',
  'CASH_TO_UPI',
  'UPI_TO_CASH',
  'POS_TO_BANK',
  'BANK_TO_POS',
  'POS_TO_CASH',
  'CASH_TO_POS',
] as const;
export type TransferType = (typeof TransferTypeEnum)[number];

export const createFundTransferSchema = z.object({
  sourceAccountId: z.string().min(1, 'Source account is required'),
  destinationAccountId: z.string().min(1, 'Destination account is required'),
  transferType: z.enum(TransferTypeEnum),
  amount: z.number().positive('Amount must be greater than zero'),
  transferDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

export type CreateFundTransferInput = z.infer<typeof createFundTransferSchema>;

export const updateFundTransferSchema = createFundTransferSchema.partial();
export type UpdateFundTransferInput = z.infer<typeof updateFundTransferSchema>;

export const fundTransferQueryFilterSchema = z.object({
  companyId: z.string().min(1).optional(),
  financialYearId: z.string().min(1).optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => new Date(val))
    .optional(),
  transferType: z.enum(TransferTypeEnum).optional(),
  sourceAccountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  voucherNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type FundTransferQueryFilter = z.infer<typeof fundTransferQueryFilterSchema>;

export interface FundTransferDto {
  id: string; // The voucher id
  voucherNumber: string;
  transferType: TransferType;
  sourceAccountId: string;
  sourceAccountName: string;
  destinationAccountId: string;
  destinationAccountName: string;
  amount: number;
  transferDate: Date;
  referenceNumber?: string;
  remarks?: string;
  isCancelled: boolean;
  createdAt: Date;
}

export interface FundTransferListDto {
  data: FundTransferDto[];
  total: number;
}
