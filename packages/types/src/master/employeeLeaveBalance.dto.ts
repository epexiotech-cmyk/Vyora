import { z } from 'zod';

export const EmployeeLeaveBalanceSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  financialYearId: z.string().uuid(),

  openingBalance: z.coerce.number().min(0),
  carriedForward: z.coerce.number().min(0),
  allotted: z.coerce.number().min(0),
  used: z.coerce.number().min(0),
  pending: z.coerce.number().min(0),
  remaining: z.coerce.number().optional(),

  syncVersion: z.number().int().default(1),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  deletedAt: z.string().or(z.date()).nullable().optional(),
});

export type EmployeeLeaveBalanceDto = z.infer<typeof EmployeeLeaveBalanceSchema>;

export const CreateEmployeeLeaveBalanceSchema = EmployeeLeaveBalanceSchema.omit({
  id: true,
  companyId: true,
  remaining: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateEmployeeLeaveBalanceInput = z.infer<typeof CreateEmployeeLeaveBalanceSchema>;

export const UpdateEmployeeLeaveBalanceSchema = CreateEmployeeLeaveBalanceSchema.partial();
export type UpdateEmployeeLeaveBalanceInput = z.infer<typeof UpdateEmployeeLeaveBalanceSchema>;

export interface SearchEmployeeLeaveBalancesOptions {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  leaveTypeId?: string;
  financialYearId?: string;
}

export interface EmployeeLeaveBalanceListDto {
  data: EmployeeLeaveBalanceDto[];
  total: number;
}
