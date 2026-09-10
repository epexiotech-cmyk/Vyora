import { randomUUID } from 'crypto';

import { weekly_off_policies, InsertWeeklyOffPolicy, WeeklyOffPolicy } from '@vyora/database';
import {
  WeeklyOffPolicyDto,
  CreateWeeklyOffPolicyInput,
  UpdateWeeklyOffPolicyInput,
  SearchWeeklyOffPoliciesOptions,
  WeeklyOffPolicyListDto,
} from '@vyora/types';
import { eq, and, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: WeeklyOffPolicy): WeeklyOffPolicyDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    employeeTypeId: entity.employeeTypeId,
    dayOfWeek: entity.dayOfWeek,
    isHalfDay: entity.isHalfDay,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class WeeklyOffPolicyRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchWeeklyOffPoliciesOptions,
    tx?: DbTransaction,
  ): Promise<WeeklyOffPolicyListDto> {
    const executor = tx || this.db;
    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(weekly_off_policies.companyId, companyId),
      isNull(weekly_off_policies.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(weekly_off_policies.isActive, options.isActive));
    }
    if (options.employeeTypeId) {
      conditions.push(eq(weekly_off_policies.employeeTypeId, options.employeeTypeId));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(weekly_off_policies)
      .where(and(...validConditions));
    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(weekly_off_policies)
      .where(and(...validConditions))
      .orderBy(desc(weekly_off_policies.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<WeeklyOffPolicyDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(weekly_off_policies)
      .where(
        and(
          eq(weekly_off_policies.companyId, companyId),
          isNull(weekly_off_policies.deletedAt),
          eq(weekly_off_policies.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<WeeklyOffPolicyDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(weekly_off_policies)
      .where(
        and(
          eq(weekly_off_policies.id, id),
          eq(weekly_off_policies.companyId, companyId),
          isNull(weekly_off_policies.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByUniqueContext(
    companyId: string,
    employeeTypeId: string,
    dayOfWeek: number,
    tx?: DbTransaction,
  ): Promise<WeeklyOffPolicyDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(weekly_off_policies)
      .where(
        and(
          eq(weekly_off_policies.companyId, companyId),
          eq(weekly_off_policies.employeeTypeId, employeeTypeId),
          eq(weekly_off_policies.dayOfWeek, dayOfWeek),
          isNull(weekly_off_policies.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateWeeklyOffPolicyInput,
    tx?: DbTransaction,
  ): Promise<WeeklyOffPolicyDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertWeeklyOffPolicy = {
      id,
      companyId,
      employeeTypeId: data.employeeTypeId,
      dayOfWeek: data.dayOfWeek,
      isHalfDay: data.isHalfDay ?? false,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(weekly_off_policies).values(insertData);

    const created = await executor
      .select()
      .from(weekly_off_policies)
      .where(eq(weekly_off_policies.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateWeeklyOffPolicyInput,
    tx?: DbTransaction,
  ): Promise<WeeklyOffPolicyDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('WeeklyOffPolicy not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(weekly_off_policies)
      .set(updateData as Partial<InsertWeeklyOffPolicy>)
      .where(eq(weekly_off_policies.id, id));

    const updated = await executor
      .select()
      .from(weekly_off_policies)
      .where(eq(weekly_off_policies.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('WeeklyOffPolicy not found');

    await executor
      .update(weekly_off_policies)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(weekly_off_policies.id, id));
  }
}
