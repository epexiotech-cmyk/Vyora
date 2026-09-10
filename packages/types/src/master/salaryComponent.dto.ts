import { z } from 'zod';

export const salaryComponentSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['Earning', 'Deduction']),
  calculationType: z.enum(['Fixed', 'Percentage']),
  calculationBase: z.string().nullable().optional(),
  baseComponentId: z.string().nullable().optional(),
  defaultAmount: z.number().int().min(0).default(0), // stored in paise
  defaultPercentage: z.number().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isBasic: z.boolean().default(false),
  isProrated: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SalaryComponentDto = z.infer<typeof salaryComponentSchema>;

export const createSalaryComponentSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['Earning', 'Deduction']),
  calculationType: z.enum(['Fixed', 'Percentage']),
  calculationBase: z.string().nullable().optional(),
  baseComponentId: z.string().nullable().optional(),
  defaultAmount: z.number().int().min(0).default(0).optional(),
  defaultPercentage: z.number().nullable().optional(),
  displayOrder: z.number().int().default(0).optional(),
  isActive: z.boolean().default(true).optional(),
  isBasic: z.boolean().default(false).optional(),
  isProrated: z.boolean().default(true).optional(),
});

export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentSchema>;

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();
export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>;

export const searchSalaryComponentsSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['Earning', 'Deduction']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export type SearchSalaryComponentsOptions = z.infer<typeof searchSalaryComponentsSchema>;

export const salaryComponentListSchema = z.object({
  items: z.array(salaryComponentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type SalaryComponentListDto = z.infer<typeof salaryComponentListSchema>;
