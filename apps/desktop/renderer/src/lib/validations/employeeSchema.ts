import { EmployeeStatusSchema, EmployeeGenderSchema } from '@vyora/types';
import { z } from 'zod';

export const employeeBankDetailSchema = z.object({
  id: z.string().uuid().optional(),
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  branchName: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false).optional(),
});

export const employeeDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  documentCategory: z.string().min(1, 'Document category is required'),
  documentName: z.string().min(1, 'Document name is required'),
  documentNumber: z.string().nullable().optional(),
  // For new uploads we might have a file object
  file: z.any().optional(),
  // For existing we might have filePath from DTO
  filePath: z.string().optional(),
});

export const employeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().nullable().optional(),
  lastName: z.string().min(1, 'Last name is required'),

  employeeTypeId: z.string().uuid().nullable().optional(),
  status: EmployeeStatusSchema.default('Active').optional(),
  joiningDate: z.coerce.date(),
  confirmationDate: z.coerce.date().nullable().optional(),
  leavingDate: z.coerce.date().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().nullable().optional(),
  reportingManagerId: z.string().uuid().nullable().optional(),
  workLocationId: z.string().uuid().nullable().optional(),

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
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val);
      },
      { message: 'Invalid mobile number' },
    ),

  dateOfBirth: z.coerce.date().nullable().optional(),
  gender: EmployeeGenderSchema.nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
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

  panNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val);
      },
      { message: 'Invalid PAN format' },
    ),
  uanNumber: z.string().nullable().optional(),
  esicNumber: z.string().nullable().optional(),

  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactNumber: z.string().nullable().optional(),
  emergencyContactAddress: z.string().nullable().optional(),

  bankDetails: z.array(employeeBankDetailSchema).default([]),
  documents: z.array(employeeDocumentSchema).default([]),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
