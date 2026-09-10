import { z } from 'zod';

export const payrollPeriodStatusSchema = z.enum([
  'Draft',
  'Processing',
  'Calculated',
  'Pending Approval',
  'Approved',
  'Finalized',
  'Locked',
]);

export const payrollPeriodSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  financialYearId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  fromDate: z.date(),
  toDate: z.date(),
  status: payrollPeriodStatusSchema,
  approvedBy: z.string().nullable().optional(),
  finalizedAt: z.date().nullable().optional(),
  syncVersion: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type PayrollPeriod = z.infer<typeof payrollPeriodSchema>;

export const createPayrollPeriodSchema = z.object({
  financialYearId: z.string().min(1, 'Financial year is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  fromDate: z.date(),
  toDate: z.date(),
});

export type CreatePayrollPeriodDto = z.infer<typeof createPayrollPeriodSchema>;

export const updatePayrollPeriodSchema = z.object({
  status: payrollPeriodStatusSchema.optional(),
  approvedBy: z.string().nullable().optional(),
  finalizedAt: z.date().nullable().optional(),
});

export type UpdatePayrollPeriodDto = z.infer<typeof updatePayrollPeriodSchema>;

// Adding simple schema types for related entities
export const payrollResultStatusSchema = payrollPeriodStatusSchema;

export const payrollResultSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  payrollPeriodId: z.string(),
  employeeId: z.string(),
  salaryStructureId: z.string(),
  totalCalendarDays: z.number(),
  payableDays: z.number(),
  employeeCodeSnapshot: z.string(),
  employeeNameSnapshot: z.string(),
  joiningDateSnapshot: z.date(),
  leavingDateSnapshot: z.date().nullable(),
  employeeTypeIdSnapshot: z.string().nullable(),
  panSnapshot: z.string().nullable(),
  uanSnapshot: z.string().nullable(),
  esicSnapshot: z.string().nullable(),
  dateOfBirthSnapshot: z.date().nullable(),
  genderSnapshot: z.string().nullable(),
  workLocationIdSnapshot: z.string().nullable(),
  includedDays: z.number(),
  presentDays: z.number(),
  absentDays: z.number(),
  halfDays: z.number(),
  weeklyOffs: z.number(),
  holidays: z.number(),
  paidLeaves: z.number(),
  unpaidLeaves: z.number(),
  grossEarnings: z.number(),
  grossDeductions: z.number(),
  netPayable: z.number(),
  status: payrollResultStatusSchema,
  syncVersion: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type PayrollResult = z.infer<typeof payrollResultSchema>;

export const payrollResultLineSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  payrollResultId: z.string(),
  salaryComponentId: z.string().nullable(),
  nameSnapshot: z.string(),
  category: z.string(),
  amount: z.number().int(),
  isAdjustment: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollResultLine = z.infer<typeof payrollResultLineSchema>;

export const payrollStatutoryResultSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  payrollResultId: z.string(),
  statutoryType: z.enum(['EPF', 'ESIC', 'PT', 'TDS']),
  ruleVersion: z.string(),
  wageBase: z.number().int(),
  employeeAmount: z.number().int(),
  employerAmount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollStatutoryResult = z.infer<typeof payrollStatutoryResultSchema>;

export const payrollAdjustmentSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  employeeId: z.string(),
  payrollPeriodId: z.string(),
  amount: z.number().int(),
  type: z.enum(['Earning', 'Deduction']),
  reason: z.string(),
  status: z.enum(['Pending', 'Processed', 'Cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollAdjustment = z.infer<typeof payrollAdjustmentSchema>;
