import { z } from 'zod';

export const employeeTypeSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type EmployeeTypeDto = z.infer<typeof employeeTypeSchema>;

export const createEmployeeTypeSchema = employeeTypeSchema.omit({
  id: true,
  companyId: true,
  isSystem: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateEmployeeTypeInput = z.infer<typeof createEmployeeTypeSchema>;

export const updateEmployeeTypeSchema = createEmployeeTypeSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateEmployeeTypeInput = z.infer<typeof updateEmployeeTypeSchema>;

export const searchEmployeeTypesSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchEmployeeTypesOptions = z.infer<typeof searchEmployeeTypesSchema>;

export interface EmployeeTypeListDto {
  data: EmployeeTypeDto[];
  total: number;
}
