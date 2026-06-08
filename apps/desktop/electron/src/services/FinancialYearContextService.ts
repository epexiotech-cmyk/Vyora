import { FinancialYearDto } from '@vyora/types';

import { companyContextService } from './CompanyContextService';
import { FinancialYearService } from './FinancialYearService';

export class FinancialYearContextService {
  private fyService = new FinancialYearService();
  private activeFinancialYear: FinancialYearDto | null = null;

  public async loadActiveFinancialYear(companyId: string): Promise<FinancialYearDto | null> {
    const activeFy = await this.fyService.getActiveFinancialYear(companyId);
    this.activeFinancialYear = activeFy;
    return activeFy;
  }

  public getActiveFinancialYear(): FinancialYearDto | null {
    return this.activeFinancialYear;
  }

  public async setActiveFinancialYear(companyId: string, financialYearId: string): Promise<void> {
    await this.fyService.setActiveFinancialYear(companyId, financialYearId);
    // Reload into context only if the target company is currently active
    if (companyId === companyContextService.getActiveCompany()) {
      await this.loadActiveFinancialYear(companyId);
    }
  }
}

export const financialYearContextService = new FinancialYearContextService();
