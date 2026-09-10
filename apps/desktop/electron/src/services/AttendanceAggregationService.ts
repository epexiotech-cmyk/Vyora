import {
  AttendanceAggregationResult,
  AggregateAttendanceOptions,
  aggregateAttendanceOptionsSchema,
  DailyAttendanceResult,
} from '@vyora/types';

import { attendanceCalculationService } from './AttendanceCalculationService';
import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';

export class AttendanceAggregationService {
  public async aggregateEmployeeAttendance(
    options: AggregateAttendanceOptions,
  ): Promise<AttendanceAggregationResult> {
    const validatedData = aggregateAttendanceOptionsSchema.parse(options);
    const { employeeId, fromDate, toDate } = validatedData;

    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const employee = await employeeService.getById(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new Error('Employee not found or belongs to another company');
    }

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      throw new Error('fromDate cannot be after toDate');
    }

    // Safely calculate total calendar days. (end - start) in MS. Add 1 for inclusive.
    // Use Math.round to avoid daylight saving time offset issues causing fractional days.
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalCalendarDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

    if (totalCalendarDays > 366) {
      throw new Error('Cannot aggregate a range greater than 366 calendar days');
    }

    const dailyDetails: DailyAttendanceResult[] = [];
    let includedDays = 0;
    let excludedDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let weeklyOffs = 0;
    let holidays = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let payableDays = 0;

    const currentDate = new Date(start);

    for (let i = 0; i < totalCalendarDays; i++) {
      const dailyResult = await attendanceCalculationService.calculateDailyAttendance(
        employeeId,
        currentDate,
      );

      dailyDetails.push(dailyResult);

      if (!dailyResult.included) {
        excludedDays++;
      } else {
        includedDays++;
        if (dailyResult.status === 'Present') presentDays++;
        else if (dailyResult.status === 'Absent') absentDays++;
        else if (dailyResult.status === 'Half Day') halfDays++;
        else if (dailyResult.status === 'Weekly Off') weeklyOffs++;
        else if (dailyResult.status === 'Holiday') holidays++;

        paidLeaves += dailyResult.paidLeaveValue;
        unpaidLeaves += dailyResult.unpaidLeaveValue;
        payableDays += dailyResult.payableValue;
      }

      // Advance one day safely
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      employeeId,
      fromDate: start,
      toDate: end,
      totalCalendarDays,
      includedDays,
      excludedDays,
      presentDays,
      absentDays,
      halfDays,
      weeklyOffs,
      holidays,
      paidLeaves,
      unpaidLeaves,
      payableDays,
      dailyDetails,
    };
  }
}

export const attendanceAggregationService = new AttendanceAggregationService();
