import { randomUUID } from 'crypto';

import { employee_types, InsertEmployeeType, EmployeeType } from '@vyora/database';
import {
  EmployeeTypeDto,
  CreateEmployeeTypeInput,
  UpdateEmployeeTypeInput,
  SearchEmployeeTypesOptions,
  EmployeeTypeListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: EmployeeType): EmployeeTypeDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    isActive: entity.isActive,
    isSystem: entity.isSystem,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class EmployeeTypeRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchEmployeeTypesOptions,
    tx?: DbTransaction,
  ): Promise<EmployeeTypeListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(employee_types.companyId, companyId),
      isNull(employee_types.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(employee_types.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = like(employee_types.name, q);
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(employee_types)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(employee_types)
      .where(and(...validConditions))
      .orderBy(desc(employee_types.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<EmployeeTypeDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(employee_types)
      .where(
        and(
          eq(employee_types.companyId, companyId),
          isNull(employee_types.deletedAt),
          eq(employee_types.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_types)
      .where(
        and(
          eq(employee_types.id, id),
          eq(employee_types.companyId, companyId),
          isNull(employee_types.deletedAt),
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
  ): Promise<EmployeeTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_types)
      .where(
        and(
          eq(employee_types.companyId, companyId),
          isNull(employee_types.deletedAt),
          eq(sql`lower(${employee_types.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateEmployeeTypeInput,
    isSystem: boolean = false,
    tx?: DbTransaction,
  ): Promise<EmployeeTypeDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertEmployeeType = {
      id,
      companyId,
      name: data.name,
      isActive: data.isActive ?? true,
      isSystem,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(employee_types).values(insertData);

    const created = await executor
      .select()
      .from(employee_types)
      .where(eq(employee_types.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeTypeInput,
    tx?: DbTransaction,
  ): Promise<EmployeeTypeDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('EmployeeType not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(employee_types)
      .set(updateData as Partial<InsertEmployeeType>)
      .where(eq(employee_types.id, id));

    const updated = await executor
      .select()
      .from(employee_types)
      .where(eq(employee_types.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('EmployeeType not found');

    await executor
      .update(employee_types)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(employee_types.id, id));
  }
}
