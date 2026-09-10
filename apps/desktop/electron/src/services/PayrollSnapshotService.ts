import { randomUUID } from 'crypto';

import {
  employees,
  employee_salary_structures,
  employee_salary_structure_lines,
  salary_components,
  payroll_periods,
  payroll_results,
  payroll_structure_inputs,
  payroll_component_inputs,
} from '@vyora/database';
import { CreatePayrollSnapshotCommandDto } from '@vyora/types';
import { and, eq, lte, isNull, or, gte } from 'drizzle-orm';

import { BaseRepository } from '../repositories/BaseRepository';

import { attendanceAggregationService } from './AttendanceAggregationService';
import { companyContextService } from './CompanyContextService';

export class PayrollSnapshotService extends BaseRepository {
  public async createForPeriod(command: CreatePayrollSnapshotCommandDto) {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const period = await this.db
      .select()
      .from(payroll_periods)
      .where(
        and(
          eq(payroll_periods.id, command.payrollPeriodId),
          eq(payroll_periods.companyId, companyId),
        ),
      )
      .get();

    if (!period) throw new Error('Payroll period not found');

    const eligibleEmployees = await this.db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.companyId, companyId),
          lte(employees.joiningDate, period.toDate),
          or(isNull(employees.leavingDate), gte(employees.leavingDate, period.fromDate)),
        ),
      );

    await this.transaction(async (tx) => {
      // 1. Update period status to Processing
      await tx
        .update(payroll_periods)
        .set({ status: 'Processing', updatedAt: new Date() })
        .where(eq(payroll_periods.id, period.id));

      for (const emp of eligibleEmployees) {
        // 2. Find eligible salary structures
        const structures = await tx
          .select()
          .from(employee_salary_structures)
          .where(
            and(
              eq(employee_salary_structures.companyId, companyId),
              eq(employee_salary_structures.employeeId, emp.id),
              lte(employee_salary_structures.effectiveFrom, period.toDate),
              or(
                isNull(employee_salary_structures.effectiveTo),
                gte(employee_salary_structures.effectiveTo, period.fromDate),
              ),
            ),
          )
          .orderBy(employee_salary_structures.effectiveFrom);

        if (structures.length === 0) {
          throw new Error(
            `Employee ${emp.employeeCode} has no applicable salary structure for the period`,
          );
        }

        // 3. Aggregate Attendance
        const attendance = await attendanceAggregationService.aggregateEmployeeAttendance({
          employeeId: emp.id,
          fromDate: period.fromDate,
          toDate: period.toDate,
        });

        // 4. Create payroll_results
        const latestStructure = structures[structures.length - 1];
        const payrollResultId = randomUUID();
        const now = new Date();

        await tx.insert(payroll_results).values({
          id: payrollResultId,
          companyId,
          payrollPeriodId: period.id,
          employeeId: emp.id,
          salaryStructureId: latestStructure.id,

          employeeCodeSnapshot: emp.employeeCode,
          employeeNameSnapshot: `${emp.firstName} ${emp.lastName}`,
          joiningDateSnapshot: emp.joiningDate,
          leavingDateSnapshot: emp.leavingDate ?? null,
          employeeTypeIdSnapshot: emp.employeeTypeId ?? null,
          panSnapshot: emp.panNumber ?? null,
          uanSnapshot: emp.uanNumber ?? null,
          esicSnapshot: emp.esicNumber ?? null,
          dateOfBirthSnapshot: emp.dateOfBirth ?? null,
          genderSnapshot: emp.gender ?? null,
          workLocationIdSnapshot: emp.workLocationId ?? null,

          includedDays: attendance.includedDays,
          presentDays: attendance.presentDays,
          absentDays: attendance.absentDays,
          halfDays: attendance.halfDays,
          weeklyOffs: attendance.weeklyOffs,
          holidays: attendance.holidays,
          paidLeaves: attendance.paidLeaves,
          unpaidLeaves: attendance.unpaidLeaves,
          totalCalendarDays: attendance.totalCalendarDays,
          payableDays: attendance.payableDays,

          createdAt: now,
          updatedAt: now,
        });

        // 5. Build structure segments
        for (const struct of structures) {
          const fromTime = Math.max(
            period.fromDate.getTime(),
            struct.effectiveFrom.getTime(),
            emp.joiningDate.getTime(),
          );

          let toTime = period.toDate.getTime();
          if (struct.effectiveTo) toTime = Math.min(toTime, struct.effectiveTo.getTime());
          if (emp.leavingDate) toTime = Math.min(toTime, emp.leavingDate.getTime());

          if (fromTime <= toTime) {
            const segFrom = new Date(fromTime);
            const segTo = new Date(toTime);

            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            const segmentCalendarDays = Math.round((toTime - fromTime) / MS_PER_DAY) + 1;

            let segmentPayableDays = 0;
            for (const daily of attendance.dailyDetails) {
              const dailyTime = daily.date.getTime();
              if (dailyTime >= fromTime && dailyTime <= toTime) {
                segmentPayableDays += daily.payableValue;
              }
            }

            const structInputId = randomUUID();

            await tx.insert(payroll_structure_inputs).values({
              id: structInputId,
              companyId,
              payrollResultId,
              salaryStructureId: struct.id,
              fromDate: segFrom,
              toDate: segTo,
              totalCalendarDays: segmentCalendarDays,
              payableDays: segmentPayableDays,
              createdAt: now,
              updatedAt: now,
            });

            // 6. Snapshot components
            const lines = await tx
              .select({
                line: employee_salary_structure_lines,
                comp: salary_components,
              })
              .from(employee_salary_structure_lines)
              .innerJoin(
                salary_components,
                eq(employee_salary_structure_lines.salaryComponentId, salary_components.id),
              )
              .where(
                and(
                  eq(employee_salary_structure_lines.structureId, struct.id),
                  eq(employee_salary_structure_lines.companyId, companyId),
                ),
              );

            for (const { line, comp } of lines) {
              await tx.insert(payroll_component_inputs).values({
                id: randomUUID(),
                companyId,
                payrollStructureInputId: structInputId,
                salaryComponentId: comp.id,
                nameSnapshot: comp.name,
                category: comp.category,
                calculationType: comp.calculationType,
                calculationBase: comp.calculationBase ?? null,
                baseComponentId: comp.baseComponentId ?? null,
                configuredAmount: line.amount,
                configuredPercentage: line.percentage ?? null,
                displayOrder: line.displayOrder,
                isBasic: comp.isBasic,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      }
    });

    return { success: true };
  }
}

export const payrollSnapshotService = new PayrollSnapshotService();
