import { randomUUID } from 'crypto';

import { employee_leave_balances } from '@vyora/database';
import {
  EmployeeLeaveBalanceDto,
  CreateEmployeeLeaveBalanceInput,
  UpdateEmployeeLeaveBalanceInput,
  SearchEmployeeLeaveBalancesOptions,
  EmployeeLeaveBalanceListDto,
} from '@vyora/types';
import { eq, and, sql } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

function mapToDto(record: typeof employee_leave_balances.$inferSelect): EmployeeLeaveBalanceDto {
  const openingBalance = record.openingBalance ?? 0;
  const carriedForward = record.carriedForward ?? 0;
  const allotted = record.allotted ?? 0;
  const used = record.used ?? 0;
  const pending = record.pending ?? 0;
  const remaining = openingBalance + carriedForward + allotted - used - pending;

  return {
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    leaveTypeId: record.leaveTypeId,
    financialYearId: record.financialYearId,
    openingBalance,
    carriedForward,
    allotted,
    used,
    pending,
    remaining,
    syncVersion: record.syncVersion ?? 1,
    createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : undefined,
  };
}

export class EmployeeLeaveBalanceRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchEmployeeLeaveBalancesOptions,
  ): Promise<EmployeeLeaveBalanceListDto> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const offset = (page - 1) * pageSize;

    const conditions = [
      eq(employee_leave_balances.companyId, companyId),
      sql`${employee_leave_balances.deletedAt} IS NULL`,
    ];

    if (options.employeeId) {
      conditions.push(eq(employee_leave_balances.employeeId, options.employeeId));
    }
    if (options.leaveTypeId) {
      conditions.push(eq(employee_leave_balances.leaveTypeId, options.leaveTypeId));
    }
    if (options.financialYearId) {
      conditions.push(eq(employee_leave_balances.financialYearId, options.financialYearId));
    }

    const whereClause = and(...conditions);

    const data = await this.db
      .select()
      .from(employee_leave_balances)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(employee_leave_balances)
      .where(whereClause);

    return {
      data: data.map(mapToDto),
      total: count,
    };
  }

  public async getById(
    id: string,
    companyId: string,
  ): Promise<EmployeeLeaveBalanceDto | undefined> {
    const record = await this.db
      .select()
      .from(employee_leave_balances)
      .where(
        and(
          eq(employee_leave_balances.id, id),
          eq(employee_leave_balances.companyId, companyId),
          sql`${employee_leave_balances.deletedAt} IS NULL`,
        ),
      )
      .get();
    return record ? mapToDto(record) : undefined;
  }

  public async getByUniqueContext(
    companyId: string,
    employeeId: string,
    leaveTypeId: string,
    financialYearId: string,
  ): Promise<EmployeeLeaveBalanceDto | undefined> {
    const record = await this.db
      .select()
      .from(employee_leave_balances)
      .where(
        and(
          eq(employee_leave_balances.companyId, companyId),
          eq(employee_leave_balances.employeeId, employeeId),
          eq(employee_leave_balances.leaveTypeId, leaveTypeId),
          eq(employee_leave_balances.financialYearId, financialYearId),
          sql`${employee_leave_balances.deletedAt} IS NULL`,
        ),
      )
      .get();
    return record ? mapToDto(record) : undefined;
  }

  public async create(
    companyId: string,
    data: CreateEmployeeLeaveBalanceInput,
  ): Promise<EmployeeLeaveBalanceDto> {
    const now = new Date();
    const id = randomUUID();

    const insertData = {
      id,
      companyId,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      financialYearId: data.financialYearId,
      openingBalance: data.openingBalance ?? 0,
      carriedForward: data.carriedForward ?? 0,
      allotted: data.allotted ?? 0,
      used: data.used ?? 0,
      pending: data.pending ?? 0,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(employee_leave_balances).values(insertData).run();

    const created = await this.db
      .select()
      .from(employee_leave_balances)
      .where(eq(employee_leave_balances.id, id))
      .get();

    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeLeaveBalanceInput,
  ): Promise<EmployeeLeaveBalanceDto> {
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updatedAt: now,
      syncVersion: sql`${employee_leave_balances.syncVersion} + 1`,
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.leaveTypeId !== undefined) updateData.leaveTypeId = data.leaveTypeId;
    if (data.financialYearId !== undefined) updateData.financialYearId = data.financialYearId;

    if (data.openingBalance !== undefined) updateData.openingBalance = data.openingBalance;
    if (data.carriedForward !== undefined) updateData.carriedForward = data.carriedForward;
    if (data.allotted !== undefined) updateData.allotted = data.allotted;
    if (data.used !== undefined) updateData.used = data.used;
    if (data.pending !== undefined) updateData.pending = data.pending;

    await this.db
      .update(employee_leave_balances)
      .set(updateData)
      .where(
        and(eq(employee_leave_balances.id, id), eq(employee_leave_balances.companyId, companyId)),
      )
      .run();

    const updated = await this.db
      .select()
      .from(employee_leave_balances)
      .where(eq(employee_leave_balances.id, id))
      .get();

    return mapToDto(updated!);
  }

  public async delete(id: string, companyId: string): Promise<void> {
    await this.db
      .update(employee_leave_balances)
      .set({
        deletedAt: new Date(),
        syncVersion: sql`${employee_leave_balances.syncVersion} + 1`,
      })
      .where(
        and(eq(employee_leave_balances.id, id), eq(employee_leave_balances.companyId, companyId)),
      )
      .run();
  }
}
