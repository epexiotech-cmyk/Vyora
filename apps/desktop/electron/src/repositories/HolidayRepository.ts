import { randomUUID } from 'crypto';

import { holidays, InsertHoliday, Holiday } from '@vyora/database';
import {
  HolidayDto,
  CreateHolidayInput,
  UpdateHolidayInput,
  SearchHolidaysOptions,
  HolidayListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Holiday): HolidayDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    date: entity.date,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class HolidayRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchHolidaysOptions,
    tx?: DbTransaction,
  ): Promise<HolidayListDto> {
    const executor = tx || this.db;
    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(holidays.companyId, companyId),
      isNull(holidays.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(holidays.isActive, options.isActive));
    }

    if (options.query) {
      conditions.push(like(holidays.name, `%${options.query}%`));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(holidays)
      .where(and(...validConditions));
    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(holidays)
      .where(and(...validConditions))
      .orderBy(desc(holidays.date))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<HolidayDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.companyId, companyId),
          isNull(holidays.deletedAt),
          eq(holidays.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<HolidayDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(holidays)
      .where(
        and(eq(holidays.id, id), eq(holidays.companyId, companyId), isNull(holidays.deletedAt)),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByDate(
    companyId: string,
    date: Date,
    tx?: DbTransaction,
  ): Promise<HolidayDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(holidays)
      .where(
        and(eq(holidays.companyId, companyId), isNull(holidays.deletedAt), eq(holidays.date, date)),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateHolidayInput,
    tx?: DbTransaction,
  ): Promise<HolidayDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertHoliday = {
      id,
      companyId,
      name: data.name,
      date: data.date,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(holidays).values(insertData);

    const created = await executor.select().from(holidays).where(eq(holidays.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateHolidayInput,
    tx?: DbTransaction,
  ): Promise<HolidayDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Holiday not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(holidays)
      .set(updateData as Partial<InsertHoliday>)
      .where(eq(holidays.id, id));

    const updated = await executor.select().from(holidays).where(eq(holidays.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Holiday not found');

    await executor
      .update(holidays)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(holidays.id, id));
  }
}
