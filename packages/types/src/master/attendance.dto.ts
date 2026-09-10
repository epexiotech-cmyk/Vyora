import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['Present', 'Absent', 'Half Day']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const attendanceRecordDtoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  attendanceDate: z.date(),
  status: attendanceStatusSchema,
  remarks: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AttendanceRecordDto = z.infer<typeof attendanceRecordDtoSchema>;

export const markAttendanceInputSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.date(),
  status: attendanceStatusSchema,
  remarks: z.string().nullable().optional(),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceInputSchema>;

export const clearAttendanceInputSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.date(),
});
export type ClearAttendanceInput = z.infer<typeof clearAttendanceInputSchema>;

export const searchAttendanceOptionsSchema = z.object({
  employeeId: z.string().uuid().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  status: attendanceStatusSchema.optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});
export type SearchAttendanceOptions = z.infer<typeof searchAttendanceOptionsSchema>;

export const attendanceListDtoSchema = z.object({
  items: z.array(attendanceRecordDtoSchema),
  total: z.number().int().min(0),
});
export type AttendanceListDto = z.infer<typeof attendanceListDtoSchema>;

export const derivedAttendanceStatusSchema = z.enum([
  'Present',
  'Absent',
  'Half Day',
  'Leave',
  'Weekly Off',
  'Holiday',
]);
export type DerivedAttendanceStatus = z.infer<typeof derivedAttendanceStatusSchema>;

export const dailyAttendanceResultSchema = z.object({
  included: z.boolean(),
  date: z.date(),
  status: derivedAttendanceStatusSchema.nullable(),
  dayValue: z.number().min(0).max(1),
  payableValue: z.number().min(0).max(1),
  paidLeaveValue: z.number().min(0).max(1),
  unpaidLeaveValue: z.number().min(0).max(1),
  isManualOverride: z.boolean(),
});
export type DailyAttendanceResult = z.infer<typeof dailyAttendanceResultSchema>;

export const aggregateAttendanceOptionsSchema = z.object({
  employeeId: z.string().uuid(),
  fromDate: z.date(),
  toDate: z.date(),
});
export type AggregateAttendanceOptions = z.infer<typeof aggregateAttendanceOptionsSchema>;

export const attendanceAggregationResultSchema = z.object({
  employeeId: z.string().uuid(),
  fromDate: z.date(),
  toDate: z.date(),
  totalCalendarDays: z.number().int().min(0),
  includedDays: z.number().int().min(0),
  excludedDays: z.number().int().min(0),
  presentDays: z.number().int().min(0),
  absentDays: z.number().int().min(0),
  halfDays: z.number().int().min(0),
  weeklyOffs: z.number().int().min(0),
  holidays: z.number().int().min(0),
  paidLeaves: z.number().min(0),
  unpaidLeaves: z.number().min(0),
  payableDays: z.number().min(0),
  dailyDetails: z.array(dailyAttendanceResultSchema),
});
export type AttendanceAggregationResult = z.infer<typeof attendanceAggregationResultSchema>;

export const payrollExportOptionsSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  employeeIds: z.array(z.string().uuid()).optional(),
});
export type PayrollExportOptions = z.infer<typeof payrollExportOptionsSchema>;

export const payrollExportRecordSchema = z.object({
  employeeId: z.string().uuid(),
  employeeCode: z.string(),
  employeeName: z.string(),
  fromDate: z.date(),
  toDate: z.date(),
  totalCalendarDays: z.number().int().min(0),
  includedDays: z.number().int().min(0),
  excludedDays: z.number().int().min(0),
  presentDays: z.number().int().min(0),
  absentDays: z.number().int().min(0),
  halfDays: z.number().int().min(0),
  weeklyOffs: z.number().int().min(0),
  holidays: z.number().int().min(0),
  paidLeaves: z.number().min(0),
  unpaidLeaves: z.number().min(0),
  payableDays: z.number().min(0),
  dailyDetails: z.array(dailyAttendanceResultSchema),
});
export type PayrollExportRecord = z.infer<typeof payrollExportRecordSchema>;

export const payrollExportResultSchema = z.object({
  records: z.array(payrollExportRecordSchema),
  errors: z
    .array(
      z.object({
        employeeId: z.string().uuid(),
        error: z.string(),
      }),
    )
    .optional(),
});
export type PayrollExportResult = z.infer<typeof payrollExportResultSchema>;
