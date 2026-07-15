import { randomUUID } from 'crypto';

import { financial_years, FinancialYear, InsertFinancialYear } from '@vyora/database';
import { CreateFinancialYearInput, FinancialYearDto } from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: FinancialYear): FinancialYearDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    label: entity.label,
    startDate: entity.startDate,
    endDate: entity.endDate,
    isActive: entity.isActive,
  };
}

export class FinancialYearRepository extends BaseRepository {
  public async create(
    data: CreateFinancialYearInput,
    tx?: DbTransaction,
  ): Promise<FinancialYearDto> {
    const executor = tx || this.db;
    const id = randomUUID();

    const newFy: InsertFinancialYear = {
      id,
      companyId: data.companyId,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive || false,
    };

    await executor.insert(financial_years).values(newFy);
    const created = await executor
      .select()
      .from(financial_years)
      .where(eq(financial_years.id, id))
      .get();
    return mapToDto(created!);
  }

  public createSync(data: CreateFinancialYearInput, tx: DbTransaction): FinancialYearDto {
    const id = randomUUID();
    const newFy: InsertFinancialYear = {
      id,
      companyId: data.companyId,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive || false,
    };

    tx.insert(financial_years).values(newFy).run();
    const created = tx.select().from(financial_years).where(eq(financial_years.id, id)).get();
    return mapToDto(created!);
  }

  public async getById(id: string, tx?: DbTransaction): Promise<FinancialYearDto | undefined> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(financial_years)
      .where(eq(financial_years.id, id))
      .get();
    return result ? mapToDto(result) : undefined;
  }

  public async getActive(
    companyId: string,
    tx?: DbTransaction,
  ): Promise<FinancialYearDto | undefined> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(financial_years)
      .where(and(eq(financial_years.companyId, companyId), eq(financial_years.isActive, true)))
      .get();
    return result ? mapToDto(result) : undefined;
  }

  public async listByCompany(companyId: string, tx?: DbTransaction): Promise<FinancialYearDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(financial_years)
      .where(eq(financial_years.companyId, companyId))
      .all();
    return results.map(mapToDto);
  }

  public async setActive(
    companyId: string,
    financialYearId: string,
    tx?: DbTransaction,
  ): Promise<void> {
    const executeLogic = async (executor: DbTransaction | typeof this.db) => {
      // Deactivate all for company
      await executor
        .update(financial_years)
        .set({ isActive: false })
        .where(eq(financial_years.companyId, companyId));

      // Activate specific one
      await executor
        .update(financial_years)
        .set({ isActive: true })
        .where(
          and(eq(financial_years.id, financialYearId), eq(financial_years.companyId, companyId)),
        );
    };

    if (tx) {
      await executeLogic(tx);
    } else {
      await this.db.transaction(async (innerTx) => {
        await executeLogic(innerTx as DbTransaction);
      });
    }
  }
}
