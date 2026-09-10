import {
  PayrollExportOptions,
  payrollExportOptionsSchema,
  PayrollExportResult,
  PayrollExportRecord,
  SearchEmployeesOptions,
} from '@vyora/types';

import { attendanceAggregationService } from './AttendanceAggregationService';
import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';

export class PayrollExportService {
  public async generateExport(options: PayrollExportOptions): Promise<PayrollExportResult> {
    const validatedData = payrollExportOptionsSchema.parse(options);
    const { fromDate, toDate, employeeIds } = validatedData;

    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      throw new Error('fromDate cannot be after toDate');
    }

    let targetEmployeeIds: string[] = [];

    if (employeeIds && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else {
      // Retrieve all active employees for this company if no specific IDs are provided
      const searchOptions: SearchEmployeesOptions = {
        isActive: true,
        limit: 10000, // Should be large enough to cover the whole company
      };
      const result = await employeeService.search(searchOptions);
      targetEmployeeIds = result.data.map((emp) => emp.id);
    }

    if (targetEmployeeIds.length === 0) {
      return { records: [], errors: [] };
    }

    const records: PayrollExportRecord[] = [];

    // Process sequentially to avoid blowing up DB pool
    for (const empId of targetEmployeeIds) {
      try {
        const emp = await employeeService.getById(empId);
        if (!emp || emp.companyId !== companyId) {
          throw new Error('Employee not found or belongs to another company');
        }

        const aggregation = await attendanceAggregationService.aggregateEmployeeAttendance({
          employeeId: emp.id,
          fromDate: start,
          toDate: end,
        });

        records.push({
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '),
          fromDate: aggregation.fromDate,
          toDate: aggregation.toDate,
          totalCalendarDays: aggregation.totalCalendarDays,
          includedDays: aggregation.includedDays,
          excludedDays: aggregation.excludedDays,
          presentDays: aggregation.presentDays,
          absentDays: aggregation.absentDays,
          halfDays: aggregation.halfDays,
          weeklyOffs: aggregation.weeklyOffs,
          holidays: aggregation.holidays,
          paidLeaves: aggregation.paidLeaves,
          unpaidLeaves: aggregation.unpaidLeaves,
          payableDays: aggregation.payableDays,
          dailyDetails: aggregation.dailyDetails,
        });
      } catch (err: unknown) {
        // We log the error but do not fail the entire export unless we want to?
        // The user says: "Do NOT silently export incomplete payroll data. Prefer failing the export/report generation with a clear error identifying the affected employee."
        // Oh, wait, the instructions say "Prefer failing the export/report generation with a clear error identifying the affected employee." Let me throw the error and abort.
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to generate export for employee ${empId}: ${msg}`);
      }
    }

    return { records };
  }
}

export const payrollExportService = new PayrollExportService();
