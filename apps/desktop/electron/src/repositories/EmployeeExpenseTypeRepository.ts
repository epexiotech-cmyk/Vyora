import { randomUUID } from 'crypto';

import {
  employee_expense_types,
  InsertEmployeeExpenseType,
  EmployeeExpenseType,
} from '@vyora/database';
import {
  EmployeeExpenseTypeDto,
  CreateEmployeeExpenseTypeInput,
  UpdateEmployeeExpenseTypeInput,
  SearchEmployeeExpenseTypesOptions,
  EmployeeExpenseTypeListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: EmployeeExpenseType): EmployeeExpenseTypeDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    ledgerId: entity.ledgerId,
    defaultTaxGroupId: entity.defaultTaxGroupId,
    isActive: entity.isActive,
    isSystem: entity.isSystem,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class EmployeeExpenseTypeRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchEmployeeExpenseTypesOptions,
    tx?: DbTransaction,
  ): Promise<EmployeeExpenseTypeListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(employee_expense_types.companyId, companyId),
      isNull(employee_expense_types.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(employee_expense_types.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = like(employee_expense_types.name, q);
      if (searchCondition) conditions.push(searchCondition);
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(employee_expense_types)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(employee_expense_types)
      .where(and(...validConditions))
      .orderBy(desc(employee_expense_types.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getAll(companyId: string, tx?: DbTransaction): Promise<EmployeeExpenseTypeDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(employee_expense_types)
      .where(
        and(
          eq(employee_expense_types.companyId, companyId),
          isNull(employee_expense_types.deletedAt),
          eq(employee_expense_types.isActive, true),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeExpenseTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_expense_types)
      .where(
        and(
          eq(employee_expense_types.id, id),
          eq(employee_expense_types.companyId, companyId),
          isNull(employee_expense_types.deletedAt),
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
  ): Promise<EmployeeExpenseTypeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_expense_types)
      .where(
        and(
          eq(employee_expense_types.companyId, companyId),
          isNull(employee_expense_types.deletedAt),
          eq(sql`lower(${employee_expense_types.name})`, name.toLowerCase()),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateEmployeeExpenseTypeInput,
    isSystem: boolean = false,
    tx?: DbTransaction,
  ): Promise<EmployeeExpenseTypeDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertEmployeeExpenseType = {
      id,
      companyId,
      name: data.name,
      ledgerId: data.ledgerId,
      defaultTaxGroupId: data.defaultTaxGroupId ?? null,
      isActive: data.isActive ?? true,
      isSystem,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(employee_expense_types).values(insertData);

    const created = await executor
      .select()
      .from(employee_expense_types)
      .where(eq(employee_expense_types.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeExpenseTypeInput,
    tx?: DbTransaction,
  ): Promise<EmployeeExpenseTypeDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('EmployeeExpenseType not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(employee_expense_types)
      .set(updateData as Partial<InsertEmployeeExpenseType>)
      .where(eq(employee_expense_types.id, id));

    const updated = await executor
      .select()
      .from(employee_expense_types)
      .where(eq(employee_expense_types.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('EmployeeExpenseType not found');

    await executor
      .update(employee_expense_types)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(employee_expense_types.id, id));
  }
}
