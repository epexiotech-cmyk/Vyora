import { z } from 'zod';

export const weeklyOffPolicySchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeTypeId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  isHalfDay: z.boolean().default(false),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type WeeklyOffPolicyDto = z.infer<typeof weeklyOffPolicySchema>;

export const createWeeklyOffPolicySchema = weeklyOffPolicySchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateWeeklyOffPolicyInput = z.infer<typeof createWeeklyOffPolicySchema>;

export const updateWeeklyOffPolicySchema = createWeeklyOffPolicySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateWeeklyOffPolicyInput = z.infer<typeof updateWeeklyOffPolicySchema>;

export const searchWeeklyOffPoliciesSchema = z.object({
  employeeTypeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchWeeklyOffPoliciesOptions = z.infer<typeof searchWeeklyOffPoliciesSchema>;

export interface WeeklyOffPolicyListDto {
  data: WeeklyOffPolicyDto[];
  total: number;
}
