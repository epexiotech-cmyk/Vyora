import { z } from 'zod';

export const leaveTypeSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type LeaveTypeDto = z.infer<typeof leaveTypeSchema>;

export const createLeaveTypeSchema = leaveTypeSchema.omit({
  id: true,
  companyId: true,
  isSystem: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;

export const searchLeaveTypesSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchLeaveTypesOptions = z.infer<typeof searchLeaveTypesSchema>;

export interface LeaveTypeListDto {
  data: LeaveTypeDto[];
  total: number;
}
