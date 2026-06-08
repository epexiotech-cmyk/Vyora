import { CreateFinancialYearInput, FinancialYearDto } from '@vyora/types';

import { DbTransaction } from '../repositories/BaseRepository';
import { FinancialYearRepository } from '../repositories/FinancialYearRepository';

export class FinancialYearService {
  private fyRepo = new FinancialYearRepository();

  public async createFinancialYear(
    input: CreateFinancialYearInput,
    tx?: DbTransaction,
  ): Promise<FinancialYearDto> {
    return await this.fyRepo.create(input, tx);
  }

  public async getActiveFinancialYear(companyId: string): Promise<FinancialYearDto | null> {
    const fy = await this.fyRepo.getActive(companyId);
    return fy || null;
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
