import { randomUUID } from 'crypto';

import { InsertSalaryComponent, SalaryComponent, salary_components } from '@vyora/database';
import { and, eq, like, or, sql } from 'drizzle-orm';

import { companyContextService } from '../services/CompanyContextService';

import { BaseRepository } from './BaseRepository';

export class SalaryComponentRepository extends BaseRepository {
  public async search(options: {
    query?: string;
    category?: 'Earning' | 'Deduction';
    isActive?: boolean;
    page: number;
    pageSize: number;
  }): Promise<{ items: SalaryComponent[]; total: number }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const { query, category, isActive, page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(salary_components.companyId, companyId)];

    if (query) {
      conditions.push(
        or(like(salary_components.name, `%${query}%`), like(salary_components.code, `%${query}%`))!,
      );
    }
    if (category) {
      conditions.push(eq(salary_components.category, category));
    }
    if (isActive !== undefined) {
      conditions.push(eq(salary_components.isActive, isActive));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(salary_components)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(salary_components)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(salary_components.displayOrder);

    return {
      items,
      total: Number(totalResult.count),
    };
  }

  public async getById(id: string): Promise<SalaryComponent | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const result = await this.db
      .select()
      .from(salary_components)
      .where(and(eq(salary_components.id, id), eq(salary_components.companyId, companyId)))
      .get();

    return result || null;
  }

  public async create(
    data: Omit<
      InsertSalaryComponent,
      'id' | 'companyId' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Promise<SalaryComponent> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return this.transaction(async (tx) => {
      const now = new Date();
      const id = randomUUID();

      await tx.insert(salary_components).values({
        ...data,
        id,
        companyId,
        createdAt: now,
        updatedAt: now,
        syncVersion: 1,
      });

      const result = await tx
        .select()
        .from(salary_components)
        .where(eq(salary_components.id, id))
        .get();

      return result!;
    });
  }

  public async update(
    id: string,
    data: Partial<
      Omit<
        InsertSalaryComponent,
        'id' | 'companyId' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >,
  ): Promise<SalaryComponent> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return this.transaction(async (tx) => {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Salary component not found or access denied');

      const updateData = {
        ...data,
        updatedAt: new Date(),
        syncVersion: existing.syncVersion + 1,
      };

      await tx
        .update(salary_components)
        .set(updateData as Partial<InsertSalaryComponent>)
        .where(and(eq(salary_components.id, id), eq(salary_components.companyId, companyId)));

      const result = await tx
        .select()
        .from(salary_components)
        .where(eq(salary_components.id, id))
        .get();

      return result!;
    });
  }

  public async deactivate(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const existing = await this.getById(id);
    if (!existing) throw new Error('Salary component not found');

    await this.db
      .update(salary_components)
      .set({
        isActive: false,
        updatedAt: new Date(),
        syncVersion: existing.syncVersion + 1,
      })
      .where(and(eq(salary_components.id, id), eq(salary_components.companyId, companyId)));
  }

  public async getByCode(code: string): Promise<SalaryComponent | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const result = await this.db
      .select()
      .from(salary_components)
      .where(and(eq(salary_components.code, code), eq(salary_components.companyId, companyId)))
      .get();

    return result || null;
  }
}

export const salaryComponentRepository = new SalaryComponentRepository();
