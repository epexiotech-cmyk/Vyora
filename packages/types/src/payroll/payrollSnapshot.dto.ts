import { z } from 'zod';

export const payrollComponentInputSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  payrollStructureInputId: z.string(),
  salaryComponentId: z.string(),
  nameSnapshot: z.string(),
  category: z.enum(['Earning', 'Deduction']),
  calculationType: z.enum(['Fixed', 'Percentage']),
  calculationBase: z.string().nullable(),
  baseComponentId: z.string().nullable(),
  configuredAmount: z.number(),
  configuredPercentage: z.number().nullable(),
  displayOrder: z.number(),
  isBasic: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollComponentInputDto = z.infer<typeof payrollComponentInputSchema>;

export const payrollStructureInputSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  payrollResultId: z.string(),
  salaryStructureId: z.string(),
  fromDate: z.date(),
  toDate: z.date(),
  totalCalendarDays: z.number(),
  payableDays: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  components: z.array(payrollComponentInputSchema).optional(),
});

export type PayrollStructureInputDto = z.infer<typeof payrollStructureInputSchema>;

export const createPayrollSnapshotCommandSchema = z.object({
  payrollPeriodId: z.string(),
});

export type CreatePayrollSnapshotCommandDto = z.infer<typeof createPayrollSnapshotCommandSchema>;
