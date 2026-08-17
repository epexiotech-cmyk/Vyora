import { randomUUID } from 'crypto';

import {
  ledger_groups,
  InsertLedgerGroup,
  LedgerGroup,
  ledgers,
  Ledger,
  InsertLedger,
  vouchers,
  voucher_entries,
} from '@vyora/database';
import {
  LedgerGroupDto,
  CreateLedgerGroupInput,
  UpdateLedgerGroupInput,
  SearchLedgerGroupsOptions,
  LedgerGroupListDto,
  LedgerDto,
  CreateLedgerInput,
  UpdateLedgerInput,
  SearchLedgersOptions,
  LedgerListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapGroupToDto(entity: LedgerGroup): LedgerGroupDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    name: entity.name,
    parentGroupId: entity.parentGroupId,
    nature: entity.nature,
    isSystemGroup: entity.isSystemGroup,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

function mapLedgerToDto(entity: Ledger): LedgerDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    branchId: entity.branchId,
    groupId: entity.groupId,
    name: entity.name,
    referenceType: entity.referenceType,
    referenceId: entity.referenceId,
    isSystemAccount: entity.isSystemAccount,
    allowManualPosting: entity.allowManualPosting,
    isFrozen: entity.isFrozen,
    openingBalance: entity.openingBalance,
    openingType: entity.openingType as 'Dr' | 'Cr',
    notes: entity.notes,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class ChartOfAccountsRepository extends BaseRepository {
  public async searchGroups(
    companyId: string,
    options: SearchLedgerGroupsOptions,
    tx?: DbTransaction,
  ): Promise<LedgerGroupListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(ledger_groups.companyId, companyId),
      isNull(ledger_groups.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(ledger_groups.isActive, options.isActive));
    }
    if (options.nature) {
      conditions.push(eq(ledger_groups.nature, options.nature));
    }
    if (options.query) {
      conditions.push(like(ledger_groups.name, `%${options.query}%`));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];

    const baseQuery = executor
      .select()
      .from(ledger_groups)
      .where(and(...validConditions));

    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(ledger_groups)
      .where(and(...validConditions))
      .orderBy(desc(ledger_groups.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapGroupToDto),
      total,
    };
  }

  public async getAllGroups(companyId: string, tx?: DbTransaction): Promise<LedgerGroupDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(ledger_groups)
      .where(
        and(
          eq(ledger_groups.companyId, companyId),
          isNull(ledger_groups.deletedAt),
          eq(ledger_groups.isActive, true),
        ),
      )
      .all();
    return results.map(mapGroupToDto);
  }

  public async getGroupById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<LedgerGroupDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(ledger_groups)
      .where(
        and(
          eq(ledger_groups.id, id),
          eq(ledger_groups.companyId, companyId),
          isNull(ledger_groups.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapGroupToDto(result);
  }

  public getGroupByName(
    companyId: string,
    name: string,
    tx?: DbTransaction,
  ): LedgerGroupDto | null {
    const executor = tx || this.db;
    const result = executor
      .select()
      .from(ledger_groups)
      .where(
        and(
          eq(ledger_groups.companyId, companyId),
          isNull(ledger_groups.deletedAt),
          eq(ledger_groups.name, name),
        ),
      )
      .get();
    if (!result) return null;
    return mapGroupToDto(result);
  }

  public async createGroup(
    companyId: string,
    data: CreateLedgerGroupInput,
    tx?: DbTransaction,
  ): Promise<LedgerGroupDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertLedgerGroup = {
      id,
      companyId,
      name: data.name,
      parentGroupId: data.parentGroupId || null,
      nature: data.nature,
      isSystemGroup: false, // User created groups are never system groups
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(ledger_groups).values(insertData);

    const created = await executor
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.id, id))
      .get();
    return mapGroupToDto(created!);
  }

  public async updateGroup(
    id: string,
    companyId: string,
    data: UpdateLedgerGroupInput,
    tx?: DbTransaction,
  ): Promise<LedgerGroupDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getGroupById(id, companyId, tx);
    if (!existing) throw new Error('Ledger group not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(ledger_groups)
      .set(updateData as Partial<InsertLedgerGroup>)
      .where(eq(ledger_groups.id, id));

    const updated = await executor
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.id, id))
      .get();
    return mapGroupToDto(updated!);
  }

  public async deactivateGroup(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getGroupById(id, companyId, tx);
    if (!existing) throw new Error('Ledger group not found');

    await executor
      .update(ledger_groups)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(ledger_groups.id, id));
  }

  // ============================================================================
  // LEDGERS
  // ============================================================================

  public async searchLedgers(
    companyId: string,
    options: SearchLedgersOptions,
    tx?: DbTransaction,
  ): Promise<LedgerListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(ledgers.companyId, companyId),
      isNull(ledgers.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(ledgers.isActive, options.isActive));
    }
    if (options.groupId) {
      conditions.push(eq(ledgers.groupId, options.groupId));
    }
    if (options.query) {
      conditions.push(like(ledgers.name, `%${options.query}%`));
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];

    const baseQuery = executor
      .select()
      .from(ledgers)
      .where(and(...validConditions));

    const allResults = await baseQuery.all();
    const total = allResults.length;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(ledgers)
      .where(and(...validConditions))
      .orderBy(desc(ledgers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapLedgerToDto),
      total,
    };
  }

  public getLedgerById(id: string, companyId: string, tx?: DbTransaction): LedgerDto | null {
    const executor = tx || this.db;
    const result = executor
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.id, id), eq(ledgers.companyId, companyId), isNull(ledgers.deletedAt)))
      .get();
    if (!result) return null;
    return mapLedgerToDto(result);
  }

  public async getLedgerByNameAndGroup(
    companyId: string,
    groupId: string,
    name: string,
    tx?: DbTransaction,
  ): Promise<LedgerDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, companyId),
          eq(ledgers.groupId, groupId),
          eq(ledgers.name, name),
          isNull(ledgers.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapLedgerToDto(result);
  }

  public createLedger(companyId: string, data: CreateLedgerInput, tx?: DbTransaction): LedgerDto {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertLedger = {
      id,
      companyId,
      groupId: data.groupId,
      name: data.name,
      referenceType: 'MANUAL', // For manual ledgers via this repository
      isSystemAccount: false,
      allowManualPosting: true,
      isFrozen: false,
      openingBalance: data.openingBalance || 0,
      openingType: data.openingType || 'Dr',
      notes: data.notes || null,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    executor.insert(ledgers).values(insertData).run();

    const created = executor.select().from(ledgers).where(eq(ledgers.id, id)).get();
    return mapLedgerToDto(created!);
  }

  public updateLedger(
    id: string,
    companyId: string,
    data: UpdateLedgerInput,
    tx?: DbTransaction,
  ): LedgerDto {
    const executor = tx || this.db;
    const now = new Date();

    const existing = this.getLedgerById(id, companyId, tx);
    if (!existing) throw new Error('Ledger not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    executor
      .update(ledgers)
      .set(updateData as Partial<InsertLedger>)
      .where(eq(ledgers.id, id))
      .run();

    const updated = executor.select().from(ledgers).where(eq(ledgers.id, id)).get();
    return mapLedgerToDto(updated!);
  }

  public deactivateLedger(id: string, companyId: string, tx?: DbTransaction): void {
    const executor = tx || this.db;
    const now = new Date();

    const existing = this.getLedgerById(id, companyId, tx);
    if (!existing) throw new Error('Ledger not found');

    executor
      .update(ledgers)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(ledgers.id, id))
      .run();
  }

  public hasTransactions(ledgerId: string, tx?: DbTransaction): boolean {
    const executor = tx || this.db;

    // Check voucher_entries joined with vouchers where isCancelled is false and deletedAt is null
    const result = executor
      .select({ count: sql<number>`count(*)` })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucher_entries.ledgerId, ledgerId),
          eq(vouchers.isCancelled, false),
          isNull(vouchers.deletedAt),
        ),
      )
      .get();

    return (result?.count || 0) > 0;
  }

  public getTransactionCounts(
    ledgerId: string,
    tx?: DbTransaction,
  ): { journalCount: number; voucherCount: number; nonOpeningCount: number } {
    const executor = tx || this.db;

    const journalResult = executor
      .select({
        count: sql<number>`count(*)`,
        nonOpeningCount: sql<number>`SUM(CASE WHEN ${vouchers.referenceType} IS NULL OR ${vouchers.referenceType} != 'PAYMENT_ACCOUNT_OPENING' THEN 1 ELSE 0 END)`,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucher_entries.ledgerId, ledgerId),
          eq(vouchers.isCancelled, false),
          isNull(vouchers.deletedAt),
        ),
      )
      .get();

    // Since Vyora combines vouchers and journals into the same table sometimes (based on context),
    // Or maybe vouchers table vs journals. Assuming the simple case for now based on the DB schema.
    // We'll return the same count for both if they are the same table, or split if there's a voucher type.
    // For now, return the total in journalCount.
    return {
      journalCount: journalResult?.count || 0,
      voucherCount: 0, // Update this if vouchers are tracked separately
      nonOpeningCount: journalResult?.nonOpeningCount || 0,
    };
  }

  public getBulkTransactionCounts(
    ledgerIds: string[],
    tx?: DbTransaction,
  ): Record<string, { journalCount: number; voucherCount: number; nonOpeningCount: number }> {
    if (!ledgerIds.length) return {};

    const executor = tx || this.db;

    // We can use an 'inArray' query. But SQLite max variables limit might be an issue if there are thousands.
    // However, for typical company payment accounts, there are maybe 5-20.
    const results = executor
      .select({
        ledgerId: voucher_entries.ledgerId,
        count: sql<number>`count(*)`,
        nonOpeningCount: sql<number>`SUM(CASE WHEN ${vouchers.referenceType} IS NULL OR ${vouchers.referenceType} != 'PAYMENT_ACCOUNT_OPENING' THEN 1 ELSE 0 END)`,
      })
      .from(voucher_entries)
      .innerJoin(vouchers, eq(voucher_entries.voucherId, vouchers.id))
      .where(
        and(
          sql`${voucher_entries.ledgerId} IN (${sql.join(
            ledgerIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          eq(vouchers.isCancelled, false),
          isNull(vouchers.deletedAt),
        ),
      )
      .groupBy(voucher_entries.ledgerId)
      .all();

    const counts: Record<
      string,
      { journalCount: number; voucherCount: number; nonOpeningCount: number }
    > = {};
    for (const id of ledgerIds) {
      counts[id] = { journalCount: 0, voucherCount: 0, nonOpeningCount: 0 };
    }

    for (const row of results) {
      if (row.ledgerId) {
        counts[row.ledgerId] = {
          journalCount: row.count || 0,
          voucherCount: 0,
          nonOpeningCount: row.nonOpeningCount || 0,
        };
      }
    }

    return counts;
  }
}
