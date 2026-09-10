import { randomUUID } from 'crypto';

import { leave_policies, InsertLeavePolicy, LeavePolicy } from '@vyora/database';
import {
  LeavePolicyDto,
  CreateLeavePolicyInput,
  UpdateLeavePolicyInput,
  SearchLeavePoliciesOptions,
  LeavePolicyListDto,
} from '@vyora/types';
import { eq, and, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: LeavePolicy): LeavePolicyDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    leaveTypeId: entity.leaveTypeId,
    employeeTypeId: entity.employeeTypeId,
    financialYearId: entity.financialYearId,
    annualEntitlement: entity.annualEntitlement,
    maxCarryForward: entity.maxCarryForward,
    isEncashable: entity.isEncashable,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class LeavePolicyRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchLeavePoliciesOptions,
    tx?: DbTransaction,
  ): Promise<LeavePolicyListDto> {
    const executor = tx || this.db;
    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(leave_policies.companyId, companyId),
      isNull(leave_policies.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(leave_policies.isActive, options.isActive));
    }
    if (options.financialYearId) {
      conditions.push(eq(leave_policies.financialYearId, options.financialYearId));
    }
    if (options.leaveTypeId) {
      conditions.push(eq(leave_policies.leaveTypeId, options.leaveTypeId));
    }
    if (options.employeeTypeId) {
      conditions.push(eq(leave_policies.employeeTypeId, options.employeeTypeId));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(leave_policies)
      .where(and(...validConditions));
    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(leave_policies)
      .where(and(...validConditions))
      .orderBy(desc(leave_policies.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<LeavePolicyDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(leave_policies)
      .where(
        and(
          eq(leave_policies.companyId, companyId),
          isNull(leave_policies.deletedAt),
          eq(leave_policies.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<LeavePolicyDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(leave_policies)
      .where(
        and(
          eq(leave_policies.id, id),
          eq(leave_policies.companyId, companyId),
          isNull(leave_policies.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByUniqueContext(
    companyId: string,
    leaveTypeId: string,
    employeeTypeId: string,
    financialYearId: string,
    tx?: DbTransaction,
  ): Promise<LeavePolicyDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(leave_policies)
      .where(
        and(
          eq(leave_policies.companyId, companyId),
          eq(leave_policies.leaveTypeId, leaveTypeId),
          eq(leave_policies.employeeTypeId, employeeTypeId),
          eq(leave_policies.financialYearId, financialYearId),
          isNull(leave_policies.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateLeavePolicyInput,
    tx?: DbTransaction,
  ): Promise<LeavePolicyDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertLeavePolicy = {
      id,
      companyId,
      leaveTypeId: data.leaveTypeId,
      employeeTypeId: data.employeeTypeId,
      financialYearId: data.financialYearId,
      annualEntitlement: data.annualEntitlement,
      maxCarryForward: data.maxCarryForward,
      isEncashable: data.isEncashable ?? false,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(leave_policies).values(insertData);

    const created = await executor
      .select()
      .from(leave_policies)
      .where(eq(leave_policies.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateLeavePolicyInput,
    tx?: DbTransaction,
  ): Promise<LeavePolicyDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('LeavePolicy not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(leave_policies)
      .set(updateData as Partial<InsertLeavePolicy>)
      .where(eq(leave_policies.id, id));

    const updated = await executor
      .select()
      .from(leave_policies)
      .where(eq(leave_policies.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('LeavePolicy not found');

    await executor
      .update(leave_policies)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(leave_policies.id, id));
  }
}
