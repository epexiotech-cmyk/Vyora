import { z } from 'zod';

export enum DocumentType {
  SALES_INVOICE = 'SALES_INVOICE',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  QUOTATION = 'QUOTATION',
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',
  SALES_RETURN = 'SALES_RETURN',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  RECEIPT_VOUCHER = 'RECEIPT_VOUCHER',
  PAYMENT_VOUCHER = 'PAYMENT_VOUCHER',
  JOURNAL_VOUCHER = 'JOURNAL_VOUCHER',
  CONTRA_VOUCHER = 'CONTRA_VOUCHER',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  ITEM = 'ITEM',
}

export const documentTypeSchema = z.nativeEnum(DocumentType);

export const fyFormatSchema = z.enum(['YY-YY', 'YYYY-YY', 'YYYY-YYYY', 'FYYY-YY']);
export type FyFormat = z.infer<typeof fyFormatSchema>;

export const documentNumberingConfigSchema = z.object({
  documentType: documentTypeSchema,
  prefix: z
    .string()
    .max(10)
    .regex(
      new RegExp('^[a-zA-Z0-9_/-]*$'),
      'Only alphanumeric characters, hyphens, underscores, and slashes are allowed in prefix',
    )
    .optional()
    .nullable(),
  formatTemplate: z.string().refine((val) => val.includes('{{SEQ}}'), {
    message: 'Template must contain {{SEQ}} token',
  }),
  fyFormat: fyFormatSchema.default('YY-YY'),
  startingNumber: z.coerce.number().int().min(1).default(1),
  zeroPadding: z.coerce.number().int().min(1).max(10).default(4),
  resetYearly: z.boolean().default(true),
});

export type DocumentNumberingConfigDto = z.infer<typeof documentNumberingConfigSchema>;
