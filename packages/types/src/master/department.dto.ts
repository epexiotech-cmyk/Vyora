import { z } from 'zod';

export const departmentSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type DepartmentDto = z.infer<typeof departmentSchema>;

export const createDepartmentSchema = departmentSchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const searchDepartmentsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchDepartmentsOptions = z.infer<typeof searchDepartmentsSchema>;

export interface DepartmentListDto {
  data: DepartmentDto[];
  total: number;
}
