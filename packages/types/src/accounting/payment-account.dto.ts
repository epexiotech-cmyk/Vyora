import { z } from 'zod';

export const PaymentAccountTypeEnum = ['BANK', 'CASH', 'UPI', 'POS'] as const;
export type PaymentAccountType = (typeof PaymentAccountTypeEnum)[number];

const basePaymentAccountSchema = z.object({
  accountType: z.enum(PaymentAccountTypeEnum),
  displayName: z.string().min(1, 'Display name is required'),
  displayOrder: z.number().int().default(0),

  bankName: z.string().optional().nullable(),
  accountHolderName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), 'Invalid IFSC code')
    .optional()
    .nullable(),
  branchName: z.string().optional().nullable(),

  upiId: z.string().optional().nullable(),
  merchantName: z.string().optional().nullable(),
  qrEnabled: z.boolean().optional(),

  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const createPaymentAccountSchema = basePaymentAccountSchema.superRefine((data, ctx) => {
  if (data.accountType === 'BANK') {
    if (!data.accountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account number is required for Bank accounts',
        path: ['accountNumber'],
      });
    }
  } else if (data.accountType === 'UPI') {
    if (!data.upiId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'UPI ID is required for UPI accounts',
        path: ['upiId'],
      });
    }
  }
});

export type CreatePaymentAccountInput = z.infer<typeof createPaymentAccountSchema>;

export const updatePaymentAccountSchema = basePaymentAccountSchema.partial();
export type UpdatePaymentAccountInput = z.infer<typeof updatePaymentAccountSchema>;

export interface PaymentAccountCapabilities {
  canEdit: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  canActivate: boolean;
  hasNonOpeningLedgerEntries?: boolean;
}

export interface PaymentAccountDto {
  id: string;
  companyId: string;
  ledgerId: string;
  accountType: PaymentAccountType;

  displayName: string;
  displayOrder: number;

  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;

  upiId?: string | null;
  merchantName?: string | null;
  qrEnabled: boolean;

  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  notes?: string | null;

  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  capabilities?: PaymentAccountCapabilities;
}

export interface PaymentAccountFilterDto {
  companyId?: string;
  accountType?: PaymentAccountType;
  isActive?: boolean;
  searchQuery?: string;
  showSystemAccounts?: boolean;
}
