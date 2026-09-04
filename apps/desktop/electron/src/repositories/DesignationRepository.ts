import { randomUUID } from 'crypto';

import { designations, InsertDesignation, Designation } from '@vyora/database';
import {
  DesignationDto,
  CreateDesignationInput,
  UpdateDesignationInput,
  SearchDesignationsOptions,
  DesignationListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Designation): DesignationDto {
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

export class DesignationRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchDesignationsOptions,
    tx?: DbTransaction,
  ): Promise<DesignationListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(designations.companyId, companyId),
      isNull(designations.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(designations.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = like(designations.name, q);
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(designations)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(designations)
      .where(and(...validConditions))
      .orderBy(desc(designations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<DesignationDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(designations)
      .where(
        and(
          eq(designations.companyId, companyId),
          isNull(designations.deletedAt),
          eq(designations.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<DesignationDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(designations)
      .where(
        and(
          eq(designations.id, id),
          eq(designations.companyId, companyId),
          isNull(designations.deletedAt),
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
  ): Promise<DesignationDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(designations)
      .where(
        and(
          eq(designations.companyId, companyId),
          isNull(designations.deletedAt),
          eq(sql`lower(${designations.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateDesignationInput,
    tx?: DbTransaction,
  ): Promise<DesignationDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertDesignation = {
      id,
      companyId,
      name: data.name,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(designations).values(insertData);

    const created = await executor.select().from(designations).where(eq(designations.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateDesignationInput,
    tx?: DbTransaction,
  ): Promise<DesignationDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Designation not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(designations)
      .set(updateData as Partial<InsertDesignation>)
      .where(eq(designations.id, id));

    const updated = await executor.select().from(designations).where(eq(designations.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Designation not found');

    await executor
      .update(designations)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(designations.id, id));
  }
}
