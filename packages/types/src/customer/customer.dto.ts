// Phase 5.2.2 Foundation DTO

export interface ShippingAddressDto {
  careOf?: string | null;
  mobile?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface CustomerProfileDto {
  id: string;
  customerCode: string;
  name: string;
  contactPerson?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  landline?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  gstStateId?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  registrationType?:
    | 'Regular'
    | 'Composition'
    | 'Unregistered'
    | 'Consumer'
    | 'Overseas'
    | 'SEZ'
    | null;
  openingBalance: number;
  openingType?: 'Dr' | 'Cr' | null;
  creditLimit: number;
  creditDays: number;
  defaultPaymentAccountId?: string | null;
  defaultQrAccountId?: string | null;
  shippingAddresses?: ShippingAddressDto[] | null;
  notes?: string | null;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

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

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer Name is required')
    .max(100, 'Customer Name cannot exceed 100 characters'),
  contactPerson: z.string().max(100).optional().nullable(),
  mobile: z.string().optional().nullable(),
  alternateMobile: z.string().optional().nullable(),
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
  gstStateId: z.string().uuid('Invalid State ID').optional().nullable(),
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
  openingBalance: z.coerce.number().int().min(0, 'Opening Balance cannot be negative').default(0),
  openingType: z.enum(['Dr', 'Cr']).optional().nullable(),
  creditLimit: z.coerce.number().int().min(0).default(0),
  creditDays: z.coerce.number().int().min(0).default(0),
  defaultPaymentAccountId: z.string().uuid('Invalid Payment Account ID').optional().nullable(),
  defaultQrAccountId: z.string().uuid('Invalid QR Account ID').optional().nullable(),
  notes: z.string().optional().nullable(),
  shippingAddresses: z.array(shippingAddressSchema).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export interface SearchCustomersOptions {
  query?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerListDto {
  data: CustomerProfileDto[];
  total: number;
}
