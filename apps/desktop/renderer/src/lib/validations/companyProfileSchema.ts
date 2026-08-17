import { isValidGstin } from '@vyora/utils';
import { z } from 'zod';

export const companyProfileSchema = z.object({
  legalName: z.string().min(1, 'Legal Name is required'),
  tradeName: z.string().optional().nullable(),
  gstin: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true; // Optional
        return isValidGstin(val);
      },
      { message: 'Invalid GSTIN format' },
    ),
  pan: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        // Basic PAN Regex: 5 letters, 4 numbers, 1 letter
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val);
      },
      { message: 'Invalid PAN format' },
    ),
  constitutionType: z.string().optional().nullable(),
  constitutionTypeOther: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  businessTypeOther: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  stateCode: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
  pincode: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[1-9][0-9]{5}$/.test(val);
      },
      { message: 'Pincode must be exactly 6 digits' },
    ),
  email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return z.string().email().safeParse(val).success;
      },
      { message: 'Invalid email address' },
    ),
  mobile: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        // Allows optional +, space, dashes, and 10-15 digits
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val);
      },
      { message: 'Invalid mobile number' },
    ),
  telephone: z.string().optional().nullable(),
  website: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return z.string().url().safeParse(val).success;
      },
      { message: 'Invalid URL format' },
    ),
  currency: z
    .string()
    .min(3, 'Currency is required')
    .max(3, 'Currency code must be exactly 3 characters')
    .optional(),
  defaultUpiId: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[^@\s]+@[^@\s]+$/.test(val);
      },
      { message: 'Invalid UPI ID format' },
    ),
  upiPayeeName: z.string().optional().nullable(),
  showQrOnInvoice: z.boolean().default(false).optional().nullable(),
  showBankDetailsOnInvoice: z.boolean().default(false).optional().nullable(),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
