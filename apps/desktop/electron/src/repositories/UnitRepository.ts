import { randomUUID } from 'crypto';

import { units, InsertUnit, Unit } from '@vyora/database';
import {
  UnitDto,
  CreateUnitInput,
  UpdateUnitInput,
  SearchUnitsOptions,
  UnitListDto,
} from '@vyora/types';
import { eq, and, or, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Unit): UnitDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    shortName: entity.shortName,
    uqcCode: entity.uqcCode,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class UnitRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchUnitsOptions,
    tx?: DbTransaction,
  ): Promise<UnitListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(units.companyId, companyId),
      isNull(units.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(units.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = or(like(units.name, q), like(units.shortName, q));
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(units)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(units)
      .where(and(...validConditions))
      .orderBy(desc(units.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<UnitDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(units)
      .where(and(eq(units.companyId, companyId), isNull(units.deletedAt), eq(units.isActive, true)))
      .all();
    return results.map(mapToDto);
  }

  public async getById(id: string, companyId: string, tx?: DbTransaction): Promise<UnitDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(units)
      .where(and(eq(units.id, id), eq(units.companyId, companyId), isNull(units.deletedAt)))
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByNameOrShortName(
    companyId: string,
    name: string,
    shortName: string,
    tx?: DbTransaction,
  ): Promise<UnitDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(units)
      .where(
        and(
          eq(units.companyId, companyId),
          isNull(units.deletedAt),
          or(
            eq(sql`lower(${units.name})`, name.toLowerCase()),
            eq(sql`lower(${units.shortName})`, shortName.toLowerCase()),
          ),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateUnitInput,
    tx?: DbTransaction,
  ): Promise<UnitDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertUnit = {
      id,
      companyId,
      name: data.name,
      shortName: data.shortName,
      uqcCode: data.uqcCode ?? null,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(units).values(insertData);

    const created = await executor.select().from(units).where(eq(units.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateUnitInput,
    tx?: DbTransaction,
  ): Promise<UnitDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Unit not found');

    const restData = { ...data };
    const updateData = {
      ...restData,
      uqcCode: data.uqcCode === undefined ? existing.uqcCode : data.uqcCode,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(units)
      .set(updateData as Partial<InsertUnit>)
      .where(eq(units.id, id));

    const updated = await executor.select().from(units).where(eq(units.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Unit not found');

    await executor
      .update(units)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(units.id, id));
  }
}
