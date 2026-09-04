import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const EmployeeStatusSchema = z.enum([
  'Active',
  'On Leave',
  'Suspended',
  'Resigned',
  'Terminated',
  'Retired',
]);
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const EmployeeGenderSchema = z.enum(['Male', 'Female', 'Other']);
export type EmployeeGender = z.infer<typeof EmployeeGenderSchema>;

// ============================================================================
// Employee Documents
// ============================================================================

export const EmployeeDocumentDtoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  documentCategory: z.string(),
  documentName: z.string(),
  documentNumber: z.string().nullable(),
  filePath: z.string(),
  isActive: z.boolean(),
  syncVersion: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
export type EmployeeDocumentDto = z.infer<typeof EmployeeDocumentDtoSchema>;

export const CreateEmployeeDocumentInputSchema = z.object({
  documentCategory: z.string().min(1, 'Document category is required'),
  documentName: z.string().min(1, 'Document name is required'),
  documentNumber: z.string().nullable().optional(),
  filePath: z.string().min(1, 'File path is required'),
  isActive: z.boolean().default(true).optional(),
});
export type CreateEmployeeDocumentInput = z.infer<typeof CreateEmployeeDocumentInputSchema>;

export const UpdateEmployeeDocumentInputSchema = CreateEmployeeDocumentInputSchema.partial();
export type UpdateEmployeeDocumentInput = z.infer<typeof UpdateEmployeeDocumentInputSchema>;

// ============================================================================
// Employee Bank Details
// ============================================================================

export const EmployeeBankDetailDtoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  bankName: z.string(),
  accountHolderName: z.string(),
  accountNumber: z.string(),
  ifscCode: z.string(),
  branchName: z.string().nullable(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  syncVersion: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
export type EmployeeBankDetailDto = z.infer<typeof EmployeeBankDetailDtoSchema>;

export const CreateEmployeeBankDetailInputSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  branchName: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
});
export type CreateEmployeeBankDetailInput = z.infer<typeof CreateEmployeeBankDetailInputSchema>;

export const UpdateEmployeeBankDetailInputSchema = CreateEmployeeBankDetailInputSchema.partial();
export type UpdateEmployeeBankDetailInput = z.infer<typeof UpdateEmployeeBankDetailInputSchema>;

// ============================================================================
// Employee Master
// ============================================================================

export const EmployeeDtoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeCode: z.string(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),

  employeeTypeId: z.string().uuid().nullable(),
  status: EmployeeStatusSchema,
  joiningDate: z.date(),
  confirmationDate: z.date().nullable(),
  leavingDate: z.date().nullable(),
  departmentId: z.string().uuid().nullable(),
  designationId: z.string().uuid().nullable(),
  reportingManagerId: z.string().uuid().nullable(),
  workLocationId: z.string().uuid().nullable(),

  email: z.string().nullable(),
  mobile: z.string().nullable(),

  dateOfBirth: z.date().nullable(),
  gender: EmployeeGenderSchema.nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  pincode: z.string().nullable(),

  panNumber: z.string().nullable(),
  uanNumber: z.string().nullable(),
  esicNumber: z.string().nullable(),

  emergencyContactName: z.string().nullable(),
  emergencyContactRelation: z.string().nullable(),
  emergencyContactNumber: z.string().nullable(),
  emergencyContactAddress: z.string().nullable(),

  isActive: z.boolean(),
  syncVersion: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
export type EmployeeDto = z.infer<typeof EmployeeDtoSchema>;

export const CreateEmployeeInputSchema = z.object({
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

  email: z.string().email().nullable().optional(),
  mobile: z.string().nullable().optional(),

  dateOfBirth: z.coerce.date().nullable().optional(),
  gender: EmployeeGenderSchema.nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),

  panNumber: z.string().nullable().optional(),
  uanNumber: z.string().nullable().optional(),
  esicNumber: z.string().nullable().optional(),

  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactNumber: z.string().nullable().optional(),
  emergencyContactAddress: z.string().nullable().optional(),

  isActive: z.boolean().default(true).optional(),
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeInputSchema>;

export const UpdateEmployeeInputSchema = CreateEmployeeInputSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeInputSchema>;

export const SearchEmployeesOptionsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  status: EmployeeStatusSchema.optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  workLocationId: z.string().uuid().optional(),
});
export type SearchEmployeesOptions = z.infer<typeof SearchEmployeesOptionsSchema>;

export const EmployeeListDtoSchema = z.object({
  data: z.array(EmployeeDtoSchema),
  total: z.number(),
});
export type EmployeeListDto = z.infer<typeof EmployeeListDtoSchema>;
