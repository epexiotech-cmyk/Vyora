import { z } from 'zod';

export const expensePresetSchema = z.object({
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

export type ExpensePresetDto = z.infer<typeof expensePresetSchema>;

export const createExpensePresetSchema = expensePresetSchema.omit({
  id: true,
  companyId: true,
  isSystem: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateExpensePresetInput = z.infer<typeof createExpensePresetSchema>;

export const updateExpensePresetSchema = createExpensePresetSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateExpensePresetInput = z.infer<typeof updateExpensePresetSchema>;

export const searchExpensePresetsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchExpensePresetsOptions = z.infer<typeof searchExpensePresetsSchema>;

export interface ExpensePresetListDto {
  data: ExpensePresetDto[];
  total: number;
}
