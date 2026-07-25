import { CreateFinancialYearInput, FinancialYearDto } from '@vyora/types';

import { DbTransaction } from '../repositories/BaseRepository';
import { CompanyRepository } from '../repositories/CompanyRepository';
import { FinancialYearRepository } from '../repositories/FinancialYearRepository';

import { dbService } from './database/DatabaseService';

export class FinancialYearService {
  private fyRepo = new FinancialYearRepository();
  private companyRepo = new CompanyRepository();

  public async createFinancialYear(
    companyId: string,
    input: CreateFinancialYearInput,
    tx?: DbTransaction,
  ): Promise<FinancialYearDto> {
    const company = await this.companyRepo.getById(companyId, tx);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found.`);
    }
    if (company.deletedAt) {
      throw new Error('Cannot create a financial year for a deleted company.');
    }

    if (tx) {
      return this.createFinancialYearSync(companyId, input, tx);
    } else {
      let created: FinancialYearDto;
      dbService.getDb().transaction((innerTx) => {
        created = this.createFinancialYearSync(companyId, input, innerTx as DbTransaction);
      });
      return created!;
    }
  }

  public createFinancialYearSync(
    companyId: string,
    input: CreateFinancialYearInput,
    tx: DbTransaction,
  ): FinancialYearDto {
    if (input.startDate >= input.endDate) {
      throw new Error('Start date must be strictly before end date.');
    }

    const overlapping = this.fyRepo.findOverlappingSync(
      companyId,
      input.startDate,
      input.endDate,
      tx,
    );
    if (overlapping.length > 0) {
      throw new Error('Financial year overlaps with an existing financial year.');
    }

    const startYear = input.startDate.getFullYear();
    const endYear = input.endDate.getFullYear() % 100;
    const label = `FY ${startYear}-${endYear.toString().padStart(2, '0')}`;

    const created = this.fyRepo.createSync(
      {
        companyId,
        label,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: false,
      },
      tx,
    );

    if (input.activateAfterCreate) {
      this.fyRepo.setActiveSync(companyId, created.id, tx);
      created.isActive = true;
    }

    return created;
  }

  public async getActiveFinancialYear(companyId: string): Promise<FinancialYearDto | null> {
    const fy = await this.fyRepo.getActive(companyId);
    return fy || null;
  }

  public getByIdSync(id: string, tx: DbTransaction): FinancialYearDto | undefined {
    return this.fyRepo.getByIdSync(id, tx);
  }

  public async setActiveFinancialYear(
    companyId: string,
    financialYearId: string,
    tx?: DbTransaction,
  ): Promise<void> {
    await this.fyRepo.setActive(companyId, financialYearId, tx);
  }

  public async listFinancialYears(companyId: string): Promise<FinancialYearDto[]> {
    return await this.fyRepo.listByCompany(companyId);
  }
}

export const financialYearService = new FinancialYearService();
