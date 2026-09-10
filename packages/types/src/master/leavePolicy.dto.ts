import { z } from 'zod';

export const leavePolicySchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  employeeTypeId: z.string().uuid(),
  financialYearId: z.string().uuid(),
  annualEntitlement: z.number().min(0),
  maxCarryForward: z.number().min(0),
  isEncashable: z.boolean().default(false),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type LeavePolicyDto = z.infer<typeof leavePolicySchema>;

export const createLeavePolicySchemaBase = leavePolicySchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const createLeavePolicySchema = createLeavePolicySchemaBase.refine(
  (data) => data.maxCarryForward <= data.annualEntitlement,
  {
    message: 'Max carry forward cannot exceed annual entitlement',
    path: ['maxCarryForward'],
  },
);

export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicySchema>;

export const updateLeavePolicySchema = createLeavePolicySchemaBase.partial().extend({
  id: z.string().uuid(),
});

export type UpdateLeavePolicyInput = z.infer<typeof updateLeavePolicySchema>;

export const searchLeavePoliciesSchema = z.object({
  financialYearId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
  employeeTypeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchLeavePoliciesOptions = z.infer<typeof searchLeavePoliciesSchema>;

export interface LeavePolicyListDto {
  data: LeavePolicyDto[];
  total: number;
}
