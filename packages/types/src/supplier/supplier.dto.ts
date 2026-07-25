import { isValidGstin } from '@vyora/utils';
import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Supplier Name is required')
    .max(100, 'Supplier Name cannot exceed 100 characters'),
  contactPerson: z
    .string()
    .max(100, 'Contact Person cannot exceed 100 characters')
    .optional()
    .nullable(),
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
    .enum(['Regular', 'Composition', 'Unregistered', 'Overseas', 'SEZ'])
    .optional()
    .nullable(),

  openingBalance: z.coerce.number().int().min(0, 'Opening Balance cannot be negative').default(0),
  openingType: z.enum(['Dr', 'Cr']).optional().nullable(),
  creditLimit: z.coerce.number().int().min(0).default(0),
  creditDays: z.coerce.number().int().min(0).default(0),

  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export interface SupplierProfileDto extends CreateSupplierInput {
  id: string;
  supplierCode: string;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface SearchSuppliersOptions {
  query?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SupplierListDto {
  data: SupplierProfileDto[];
  total: number;
}
