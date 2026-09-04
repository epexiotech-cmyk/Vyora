import { randomUUID } from 'crypto';

import { leave_types, InsertLeaveType, LeaveType } from '@vyora/database';
import {
  LeaveTypeDto,
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  SearchLeaveTypesOptions,
  LeaveTypeListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: LeaveType): LeaveTypeDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    isPaid: entity.isPaid,
    isActive: entity.isActive,
    isSystem: entity.isSystem,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class LeaveTypeRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchLeaveTypesOptions,
    tx?: DbTransaction,
  ): Promise<LeaveTypeListDto> {
    const executor = tx || this.db;
    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(leave_types.companyId, companyId),
      isNull(leave_types.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(leave_types.isActive, options.isActive));
    }

    if (options.query) {
      conditions.push(like(leave_types.name, `%${options.query}%`));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(leave_types)
      .where(and(...validConditions));
    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(leave_types)
      .where(and(...validConditions))
      .orderBy(desc(leave_types.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<LeaveTypeDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(leave_types)
      .where(
        and(
          eq(leave_types.companyId, companyId),
          isNull(leave_types.deletedAt),
          eq(leave_types.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<LeaveTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(leave_types)
      .where(
        and(
          eq(leave_types.id, id),
          eq(leave_types.companyId, companyId),
          isNull(leave_types.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByName(
    companyId: string,
    name: string,
    tx?: DbTransaction,
  ): Promise<LeaveTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(leave_types)
      .where(
        and(
          eq(leave_types.companyId, companyId),
          isNull(leave_types.deletedAt),
          eq(sql`lower(${leave_types.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateLeaveTypeInput,
    isSystem: boolean = false,
    tx?: DbTransaction,
  ): Promise<LeaveTypeDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertLeaveType = {
      id,
      companyId,
      name: data.name,
      isPaid: data.isPaid ?? true,
      isActive: data.isActive ?? true,
      isSystem,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(leave_types).values(insertData);

    const created = await executor.select().from(leave_types).where(eq(leave_types.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateLeaveTypeInput,
    tx?: DbTransaction,
  ): Promise<LeaveTypeDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('LeaveType not found');
    if (existing.isSystem) throw new Error('System leave types cannot be modified');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(leave_types)
      .set(updateData as Partial<InsertLeaveType>)
      .where(eq(leave_types.id, id));

    const updated = await executor.select().from(leave_types).where(eq(leave_types.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('LeaveType not found');
    if (existing.isSystem) throw new Error('System leave types cannot be deleted');

    await executor
      .update(leave_types)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(leave_types.id, id));
  }
}
