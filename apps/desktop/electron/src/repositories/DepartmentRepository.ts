import { randomUUID } from 'crypto';

import { departments, InsertDepartment, Department } from '@vyora/database';
import {
  DepartmentDto,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  SearchDepartmentsOptions,
  DepartmentListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Department): DepartmentDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class DepartmentRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchDepartmentsOptions,
    tx?: DbTransaction,
  ): Promise<DepartmentListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(departments.companyId, companyId),
      isNull(departments.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(departments.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = like(departments.name, q);
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(departments)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(departments)
      .where(and(...validConditions))
      .orderBy(desc(departments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<DepartmentDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.companyId, companyId),
          isNull(departments.deletedAt),
          eq(departments.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<DepartmentDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.id, id),
          eq(departments.companyId, companyId),
          isNull(departments.deletedAt),
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
  ): Promise<DepartmentDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.companyId, companyId),
          isNull(departments.deletedAt),
          eq(sql`lower(${departments.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateDepartmentInput,
    tx?: DbTransaction,
  ): Promise<DepartmentDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertDepartment = {
      id,
      companyId,
      name: data.name,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(departments).values(insertData);

    const created = await executor.select().from(departments).where(eq(departments.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateDepartmentInput,
    tx?: DbTransaction,
  ): Promise<DepartmentDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Department not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(departments)
      .set(updateData as Partial<InsertDepartment>)
      .where(eq(departments.id, id));

    const updated = await executor.select().from(departments).where(eq(departments.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Department not found');

    await executor
      .update(departments)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(departments.id, id));
  }
}
