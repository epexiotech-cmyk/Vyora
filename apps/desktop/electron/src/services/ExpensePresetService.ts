import { randomUUID } from 'crypto';

import { expense_presets, InsertExpensePreset } from '@vyora/database';
import {
  CreateExpensePresetInput,
  ExpensePresetDto,
  UpdateExpensePresetInput,
  SearchExpensePresetsOptions,
} from '@vyora/types';
import { eq, and, SQL } from 'drizzle-orm';

import { DbTransaction } from '../repositories/BaseRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';

export class ExpensePresetService {
  public async create(
    input: CreateExpensePresetInput,
    tx?: DbTransaction,
  ): Promise<{ id: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const id = randomUUID();
    const insertData: InsertExpensePreset = {
      id,
      companyId,
      name: input.name,
      ledgerId: input.ledgerId,
      defaultTaxGroupId: input.defaultTaxGroupId || null,
      isActive: input.isActive ?? true,
      isSystem: false,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const executor = tx || dbService.getDb();
    executor.insert(expense_presets).values(insertData).run();

    return { id };
  }

  public async update(input: UpdateExpensePresetInput, tx?: DbTransaction): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const executor = tx || dbService.getDb();

    // Prevent modifying system presets if we need to? Or at least ledgerId.
    const existing = executor
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.id, input.id), eq(expense_presets.companyId, companyId)))
      .get();

    if (!existing) throw new Error('Expense Preset not found');
    if (existing.isSystem && input.ledgerId && input.ledgerId !== existing.ledgerId) {
      throw new Error('Cannot change the ledger of a system preset');
    }

    executor
      .update(expense_presets)
      .set({
        name: input.name,
        ledgerId: input.ledgerId,
        defaultTaxGroupId: input.defaultTaxGroupId,
        isActive: input.isActive,
        updatedAt: new Date(),
        syncVersion: existing.syncVersion + 1,
      })
      .where(and(eq(expense_presets.id, input.id), eq(expense_presets.companyId, companyId)))
      .run();
  }

  public async getById(id: string, tx?: DbTransaction): Promise<ExpensePresetDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const executor = tx || dbService.getDb();
    const preset = executor
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.id, id), eq(expense_presets.companyId, companyId)))
      .get();

    if (!preset) throw new Error('Expense Preset not found');

    // Remove deletedAt if null to match DTO if necessary, but returning directly works since deletedAt is nullable
    return preset as ExpensePresetDto;
  }

  public async search(
    options?: SearchExpensePresetsOptions,
    tx?: DbTransaction,
  ): Promise<{ data: ExpensePresetDto[]; total: number }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const executor = tx || dbService.getDb();

    // Very basic list implementation without complex search for now
    let condition = eq(expense_presets.companyId, companyId);

    if (options?.isActive !== undefined) {
      condition = and(condition, eq(expense_presets.isActive, options.isActive)) as SQL<unknown>;
    }

    const data = executor
      .select()
      .from(expense_presets)
      .where(condition)
      .all() as ExpensePresetDto[];

    return {
      data,
      total: data.length,
    };
  }

  public async deactivate(id: string, tx?: DbTransaction): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const executor = tx || dbService.getDb();

    const existing = executor
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.id, id), eq(expense_presets.companyId, companyId)))
      .get();

    if (!existing) throw new Error('Expense Preset not found');
    if (existing.isSystem) {
      throw new Error('Cannot deactivate a system preset');
    }

    executor
      .update(expense_presets)
      .set({
        isActive: false,
        updatedAt: new Date(),
        syncVersion: existing.syncVersion + 1,
      })
      .where(and(eq(expense_presets.id, id), eq(expense_presets.companyId, companyId)))
      .run();
  }
}

export const expensePresetService = new ExpensePresetService();
