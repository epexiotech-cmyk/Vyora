import { z } from 'zod';

export const employeeExpenseTypeSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  ledgerId: z.string().uuid(),
  defaultTaxGroupId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type EmployeeExpenseTypeDto = z.infer<typeof employeeExpenseTypeSchema>;

export const createEmployeeExpenseTypeSchema = employeeExpenseTypeSchema.omit({
  id: true,
  companyId: true,
  isSystem: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateEmployeeExpenseTypeInput = z.infer<typeof createEmployeeExpenseTypeSchema>;

export const updateEmployeeExpenseTypeSchema = createEmployeeExpenseTypeSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateEmployeeExpenseTypeInput = z.infer<typeof updateEmployeeExpenseTypeSchema>;

export const searchEmployeeExpenseTypesSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchEmployeeExpenseTypesOptions = z.infer<typeof searchEmployeeExpenseTypesSchema>;

export interface EmployeeExpenseTypeListDto {
  data: EmployeeExpenseTypeDto[];
  total: number;
}
