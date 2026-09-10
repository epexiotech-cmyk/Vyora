import { HolidayRepository } from '../repositories/HolidayRepository';
import { WeeklyOffPolicyRepository } from '../repositories/WeeklyOffPolicyRepository';

import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';
import { financialYearService } from './FinancialYearService';
import { leaveTypeService } from './LeaveTypeService';

export interface LeaveCalculationInput {
  employeeId: string;
  leaveTypeId: string;
  fromDate: Date;
  toDate: Date;
  requestedDays: number;
}

export interface LeaveCalculationResult {
  effectiveFullDays: number;
  excludedHolidayDays: number;
  excludedWeeklyOffDays: number;
  calendarDays: number;
  requestedDays: number;
  financialYearId: string;
}

export class LeaveCalculationService {
  private weeklyOffRepo = new WeeklyOffPolicyRepository();
  private holidayRepo = new HolidayRepository();

  public async calculateEffectiveDays(
    input: LeaveCalculationInput,
  ): Promise<LeaveCalculationResult> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    // 1. Validate dates
    const fromDate = new Date(input.fromDate);
    const toDate = new Date(input.toDate);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    if (fromDate > toDate) {
      throw new Error('fromDate must be before or equal to toDate');
    }

    // 2. Validate references
    const employee = await employeeService.getById(input.employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new Error('Employee not found or belongs to another company');
    }

    const leaveType = await leaveTypeService.getById(input.leaveTypeId);
    if (!leaveType || leaveType.companyId !== companyId) {
      throw new Error('Leave type not found or belongs to another company');
    }

    // 3. Resolve Financial Year
    const allFy = await financialYearService.listFinancialYears(companyId);

    const findFyForDate = (date: Date) => {
      return allFy.find((fy) => {
        const start = new Date(fy.startDate);
        const end = new Date(fy.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      });
    };

    const startFy = findFyForDate(fromDate);
    const endFy = findFyForDate(toDate);

    if (!startFy || !endFy) {
      throw new Error('Date range falls outside of any configured financial year');
    }
    if (startFy.id !== endFy.id) {
      throw new Error(
        'Leave requests cannot cross financial year boundaries. Please split into multiple requests.',
      );
    }

    // 4. Resolve Weekly Off Policy
    const weeklyOffOptions = await this.weeklyOffRepo.search(companyId, {
      employeeTypeId: employee.employeeTypeId || undefined,
      isActive: true,
      limit: 100,
      offset: 0,
    });
    const weeklyOffPolicies = weeklyOffOptions.data;
    const weeklyOffDays = weeklyOffPolicies.map((p) => p.dayOfWeek);

    // 5. Resolve Holidays
    const allHolidays = await this.holidayRepo.getAll(companyId);
    const activeHolidays = allHolidays.filter((h) => h.isActive);

    // 6. Calculate Days
    let calendarDays = 0;
    let excludedHolidayDays = 0;
    let excludedWeeklyOffDays = 0;
    let effectiveFullDays = 0;

    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      calendarDays++;

      const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)

      const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
      const isHoliday = activeHolidays.some((h) => {
        const hd = new Date(h.date);
        return (
          hd.getFullYear() === currentDate.getFullYear() &&
          hd.getMonth() === currentDate.getMonth() &&
          hd.getDate() === currentDate.getDate()
        );
      });

      if (isWeeklyOff && isHoliday) {
        // If it's both, we just count it as weekly off to avoid double deduction
        excludedWeeklyOffDays++;
      } else if (isWeeklyOff) {
        excludedWeeklyOffDays++;
      } else if (isHoliday) {
        excludedHolidayDays++;
      } else {
        effectiveFullDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      effectiveFullDays,
      excludedHolidayDays,
      excludedWeeklyOffDays,
      calendarDays,
      requestedDays: input.requestedDays,
      financialYearId: startFy.id,
    };
  }
}

export const leaveCalculationService = new LeaveCalculationService();
