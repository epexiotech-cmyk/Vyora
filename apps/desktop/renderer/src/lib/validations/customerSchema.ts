import { isValidGstin } from '@vyora/utils';
import { z } from 'zod';

export const shippingAddressSchema = z.object({
  careOf: z.string().max(100).optional().nullable(),
  mobile: z.string().optional().nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z
    .string()
    .refine((val) => !val || /^[1-9][0-9]{5}$/.test(val), 'Invalid Pincode format')
    .optional()
    .nullable(),
});

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer Name is required')
    .max(100, 'Customer Name cannot exceed 100 characters'),
  contactPerson: z
    .string()
    .max(100, 'Contact Person cannot exceed 100 characters')
    .optional()
    .nullable(),
  mobile: z.string().max(20, 'Mobile cannot exceed 20 digits').optional().nullable(),
  alternateMobile: z
    .string()
    .max(20, 'Alternate Mobile cannot exceed 20 digits')
    .optional()
    .nullable(),
  landline: z.string().max(20, 'Landline cannot exceed 20 characters').optional().nullable(),
  email: z
    .string()
    .trim()
    .email('Invalid email format (e.g. john@acme.com)')
    .or(z.literal(''))
    .optional()
    .nullable(),

  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z
    .string()
    .refine((val) => !val || /^[1-9][0-9]{5}$/.test(val), 'Invalid Pincode format')
    .optional()
    .nullable(),

  gstin: z
    .string()
    .trim()
    .refine(
      (val: string | null | undefined) => !val || isValidGstin(val),
      'Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)',
    )
    .optional()
    .nullable(),
  pan: z
    .string()
    .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), 'Invalid PAN format')
    .optional()
    .nullable(),
  registrationType: z
    .enum(['Regular', 'Composition', 'Unregistered', 'Consumer', 'Overseas', 'SEZ'])
    .optional()
    .nullable(),

  openingBalance: z.coerce.number().min(0, 'Opening Balance cannot be negative').default(0),
  openingType: z.enum(['Dr', 'Cr']).optional().nullable(),
  creditLimit: z.coerce.number().min(0).default(0),
  creditDays: z.coerce.number().int().min(0).default(0),

  defaultPaymentAccountId: z
    .string()
    .uuid('Invalid Payment Account ID')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  defaultQrAccountId: z
    .string()
    .uuid('Invalid QR Account ID')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  defaultSignatureId: z
    .string()
    .uuid('Invalid Signature ID')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  notes: z.string().optional().nullable(),
  shippingAddresses: z.array(shippingAddressSchema).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
