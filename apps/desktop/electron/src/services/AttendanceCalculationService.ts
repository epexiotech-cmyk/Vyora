import { DailyAttendanceResult, DerivedAttendanceStatus } from '@vyora/types';

import { attendanceRepository } from '../repositories/AttendanceRepository';
import { HolidayRepository } from '../repositories/HolidayRepository';
import { LeaveRequestRepository } from '../repositories/LeaveRequestRepository';
import { WeeklyOffPolicyRepository } from '../repositories/WeeklyOffPolicyRepository';

import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';
import { leaveTypeService } from './LeaveTypeService';

export class AttendanceCalculationService {
  private weeklyOffRepo = new WeeklyOffPolicyRepository();
  private holidayRepo = new HolidayRepository();
  private leaveRequestRepo = new LeaveRequestRepository();

  public async calculateDailyAttendance(
    employeeId: string,
    targetDate: Date,
  ): Promise<DailyAttendanceResult> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    // 1. Normalize Date
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);

    // 2. Resolve Employee
    const employee = await employeeService.getById(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new Error('Employee not found or belongs to another company');
    }

    // 3. Employment Boundary Check
    const joiningDate = new Date(employee.joiningDate);
    joiningDate.setHours(0, 0, 0, 0);

    let leavingDate: Date | null = null;
    if (employee.leavingDate) {
      leavingDate = new Date(employee.leavingDate);
      leavingDate.setHours(0, 0, 0, 0);
    }

    if (date < joiningDate || (leavingDate && date > leavingDate)) {
      return {
        included: false,
        date,
        status: null,
        dayValue: 0,
        payableValue: 0,
        paidLeaveValue: 0,
        unpaidLeaveValue: 0,
        isManualOverride: false,
      };
    }

    // 4. Manual Attendance Check (Highest Precedence)
    const manualResult = await attendanceRepository.search(companyId, {
      employeeId,
      fromDate: date,
      toDate: date,
      limit: 1,
    });

    const manualRecord = manualResult.data[0];
    if (manualRecord) {
      const isHalf = manualRecord.status === 'Half Day';
      return {
        included: true,
        date,
        status: manualRecord.status as DerivedAttendanceStatus,
        dayValue: isHalf ? 0.5 : manualRecord.status === 'Present' ? 1 : 0,
        payableValue: isHalf ? 0.5 : manualRecord.status === 'Present' ? 1 : 0,
        paidLeaveValue: 0,
        unpaidLeaveValue: 0,
        isManualOverride: true,
      };
    }

    // 5. Weekly Off Check (Calendar Exclusion)
    const weeklyOffOptions = await this.weeklyOffRepo.search(companyId, {
      employeeTypeId: employee.employeeTypeId || undefined,
      isActive: true,
      limit: 100,
      offset: 0,
    });
    const weeklyOffDays = weeklyOffOptions.data.map((p) => p.dayOfWeek);
    const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)

    if (weeklyOffDays.includes(dayOfWeek)) {
      return {
        included: true,
        date,
        status: 'Weekly Off',
        dayValue: 1, // Usually weekly off counts as a full day in calendars
        payableValue: 1, // Paid weekly off
        paidLeaveValue: 0,
        unpaidLeaveValue: 0,
        isManualOverride: false,
      };
    }

    // 6. Holiday Check (Calendar Exclusion)
    const allHolidays = await this.holidayRepo.getAll(companyId);
    const activeHolidays = allHolidays.filter((h) => h.isActive);

    const isHoliday = activeHolidays.some((h) => {
      const hd = new Date(h.date);
      return (
        hd.getFullYear() === date.getFullYear() &&
        hd.getMonth() === date.getMonth() &&
        hd.getDate() === date.getDate()
      );
    });

    if (isHoliday) {
      return {
        included: true,
        date,
        status: 'Holiday',
        dayValue: 1,
        payableValue: 1, // Paid holiday
        paidLeaveValue: 0,
        unpaidLeaveValue: 0,
        isManualOverride: false,
      };
    }

    // 7. Approved Leave Check (Applies only to working dates)
    const allLeavesResult = await this.leaveRequestRepo.search(companyId, {
      employeeId,
      status: 'Approved',
      limit: 1000,
    });

    // Find a leave request that covers the target date
    const coveringLeave = allLeavesResult.data.find((lr) => {
      const fd = new Date(lr.fromDate);
      const td = new Date(lr.toDate);
      fd.setHours(0, 0, 0, 0);
      td.setHours(23, 59, 59, 999);
      return date >= fd && date <= td;
    });

    if (coveringLeave) {
      const leaveType = await leaveTypeService.getById(coveringLeave.leaveTypeId);
      if (!leaveType) {
        throw new Error('Leave type not found for approved leave');
      }

      // If requestedDays is 0.5, we treat it as 0.5 dayValue
      // We only know it's a half day if requestedDays is fractional.
      let currentDayLeaveValue = 1;
      const fd = new Date(coveringLeave.fromDate);
      const td = new Date(coveringLeave.toDate);
      fd.setHours(0, 0, 0, 0);
      td.setHours(0, 0, 0, 0);
      if (fd.getTime() === td.getTime() && coveringLeave.requestedDays === 0.5) {
        currentDayLeaveValue = 0.5;
      }

      const isPaid = leaveType.isPaid;

      return {
        included: true,
        date,
        status: 'Leave',
        dayValue: currentDayLeaveValue,
        payableValue: isPaid ? currentDayLeaveValue : 0,
        paidLeaveValue: isPaid ? currentDayLeaveValue : 0,
        unpaidLeaveValue: isPaid ? 0 : currentDayLeaveValue,
        isManualOverride: false,
      };
    }

    // 8. Default (Absent)
    return {
      included: true,
      date,
      status: 'Absent',
      dayValue: 0,
      payableValue: 0,
      paidLeaveValue: 0,
      unpaidLeaveValue: 0,
      isManualOverride: false,
    };
  }
}

export const attendanceCalculationService = new AttendanceCalculationService();
