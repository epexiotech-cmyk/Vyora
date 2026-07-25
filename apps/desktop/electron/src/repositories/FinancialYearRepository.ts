import { randomUUID } from 'crypto';

import { financial_years, FinancialYear, InsertFinancialYear } from '@vyora/database';
import { FinancialYearDto } from '@vyora/types';
import { eq, and, gt, lt } from 'drizzle-orm';

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
    data: Omit<InsertFinancialYear, 'id'>,
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
      isActive: data.isActive,
    };

    await executor.insert(financial_years).values(newFy);
    const created = await executor
      .select()
      .from(financial_years)
      .where(eq(financial_years.id, id))
      .get();
    return mapToDto(created!);
  }

  public createSync(data: Omit<InsertFinancialYear, 'id'>, tx: DbTransaction): FinancialYearDto {
    const id = randomUUID();
    const newFy: InsertFinancialYear = {
      id,
      companyId: data.companyId,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
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

  public getByIdSync(id: string, tx: DbTransaction): FinancialYearDto | undefined {
    const result = tx.select().from(financial_years).where(eq(financial_years.id, id)).get();
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

  public async findOverlapping(
    companyId: string,
    startDate: Date,
    endDate: Date,
    tx?: DbTransaction,
  ): Promise<FinancialYearDto[]> {
    const executor = tx || this.db;

    // An overlap occurs if (newStart < existingEnd) AND (newEnd > existingStart)
    const results = await executor
      .select()
      .from(financial_years)
      .where(
        and(
          eq(financial_years.companyId, companyId),
          lt(financial_years.startDate, endDate),
          gt(financial_years.endDate, startDate),
        ),
      )
      .all();
    return results.map(mapToDto);
  }

  public findOverlappingSync(
    companyId: string,
    startDate: Date,
    endDate: Date,
    tx: DbTransaction,
  ): FinancialYearDto[] {
    const results = tx
      .select()
      .from(financial_years)
      .where(
        and(
          eq(financial_years.companyId, companyId),
          lt(financial_years.startDate, endDate),
          gt(financial_years.endDate, startDate),
        ),
      )
      .all();
    return results.map(mapToDto);
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
    if (tx) {
      this.setActiveSync(companyId, financialYearId, tx);
    } else {
      this.db.transaction((innerTx) => {
        this.setActiveSync(companyId, financialYearId, innerTx as DbTransaction);
      });
    }
  }

  public setActiveSync(companyId: string, financialYearId: string, tx: DbTransaction): void {
    // Deactivate all for company
    tx.update(financial_years)
      .set({ isActive: false })
      .where(eq(financial_years.companyId, companyId))
      .run();

    // Activate specific one
    tx.update(financial_years)
      .set({ isActive: true })
      .where(and(eq(financial_years.id, financialYearId), eq(financial_years.companyId, companyId)))
      .run();
  }
}
