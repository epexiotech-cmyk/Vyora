import { z } from 'zod';

import { FinancialYearDto } from '../system/financial-year.dto';

import { EmployeeDtoSchema } from './employee.dto';
import { leaveTypeSchema } from './leaveType.dto';

export const leaveRequestStatusEnum = z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']);

export const leaveRequestDtoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  financialYearId: z.string().uuid(),

  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  requestedDays: z.number().min(0.5),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason is too long'),

  status: leaveRequestStatusEnum,

  approverId: z.string().uuid().nullable(),
  approverRemarks: z.string().max(1000).nullable(),
  approvedAt: z.coerce.date().nullable(),

  employee: EmployeeDtoSchema.optional(),
  leaveType: leaveTypeSchema.optional(),
  financialYear: z.custom<FinancialYearDto>().optional(),
  approver: EmployeeDtoSchema.optional(),

  syncVersion: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type LeaveRequestDto = z.infer<typeof leaveRequestDtoSchema>;

export const createLeaveRequestBaseSchema = z.object({
  employeeId: z.string().uuid('Employee is required'),
  leaveTypeId: z.string().uuid('Leave Type is required'),
  financialYearId: z.string().uuid('Financial Year is required'),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  requestedDays: z.number().min(0.5, 'Requested days must be at least 0.5'),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason is too long'),
});

export const createLeaveRequestInputSchema = createLeaveRequestBaseSchema.refine(
  (data) => data.fromDate <= data.toDate,
  {
    message: 'From Date must be before or equal to To Date',
    path: ['toDate'],
  },
);

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestInputSchema>;

export const updateLeaveRequestInputSchema = createLeaveRequestBaseSchema.partial();
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestInputSchema>;

export const searchLeaveRequestsOptionsSchema = z.object({
  searchTerm: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
  financialYearId: z.string().uuid().optional(),
  status: leaveRequestStatusEnum.optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeRelations: z.boolean().optional(),
});

export type SearchLeaveRequestsOptions = z.infer<typeof searchLeaveRequestsOptionsSchema>;

export const leaveRequestListDtoSchema = z.object({
  items: z.array(leaveRequestDtoSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type LeaveRequestListDto = z.infer<typeof leaveRequestListDtoSchema>;

export const approveLeaveRequestSchema = z.object({
  approverId: z.string().uuid().optional(),
  approverRemarks: z.string().max(1000).optional(),
});
export type ApproveLeaveRequestInput = z.infer<typeof approveLeaveRequestSchema>;

export const rejectLeaveRequestSchema = z.object({
  approverId: z.string().uuid().optional(),
  approverRemarks: z.string().max(1000).optional(),
});
export type RejectLeaveRequestInput = z.infer<typeof rejectLeaveRequestSchema>;

export const cancelLeaveRequestSchema = z.object({
  remarks: z.string().max(1000).optional(),
});
export type CancelLeaveRequestInput = z.infer<typeof cancelLeaveRequestSchema>;
