import { randomUUID } from 'crypto';

import { work_locations, InsertWorkLocation, WorkLocation } from '@vyora/database';
import {
  WorkLocationDto,
  CreateWorkLocationInput,
  UpdateWorkLocationInput,
  SearchWorkLocationsOptions,
  WorkLocationListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: WorkLocation): WorkLocationDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    address: entity.address,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class WorkLocationRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchWorkLocationsOptions,
    tx?: DbTransaction,
  ): Promise<WorkLocationListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(work_locations.companyId, companyId),
      isNull(work_locations.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(work_locations.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = like(work_locations.name, q);
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(work_locations)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(work_locations)
      .where(and(...validConditions))
      .orderBy(desc(work_locations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<WorkLocationDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(work_locations)
      .where(
        and(
          eq(work_locations.companyId, companyId),
          isNull(work_locations.deletedAt),
          eq(work_locations.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<WorkLocationDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(work_locations)
      .where(
        and(
          eq(work_locations.id, id),
          eq(work_locations.companyId, companyId),
          isNull(work_locations.deletedAt),
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
  ): Promise<WorkLocationDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(work_locations)
      .where(
        and(
          eq(work_locations.companyId, companyId),
          isNull(work_locations.deletedAt),
          eq(sql`lower(${work_locations.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateWorkLocationInput,
    tx?: DbTransaction,
  ): Promise<WorkLocationDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertWorkLocation = {
      id,
      companyId,
      name: data.name,
      address: data.address ?? null,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(work_locations).values(insertData);

    const created = await executor
      .select()
      .from(work_locations)
      .where(eq(work_locations.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateWorkLocationInput,
    tx?: DbTransaction,
  ): Promise<WorkLocationDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('WorkLocation not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(work_locations)
      .set(updateData as Partial<InsertWorkLocation>)
      .where(eq(work_locations.id, id));

    const updated = await executor
      .select()
      .from(work_locations)
      .where(eq(work_locations.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('WorkLocation not found');

    await executor
      .update(work_locations)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(work_locations.id, id));
  }
}
