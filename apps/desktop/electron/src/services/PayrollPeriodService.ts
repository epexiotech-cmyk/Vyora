import { PayrollPeriod, CreatePayrollPeriodDto, createPayrollPeriodSchema } from '@vyora/types';

import { payrollPeriodRepository } from '../repositories/PayrollPeriodRepository';

import { companyContextService } from './CompanyContextService';

export class PayrollPeriodService {
  async listPeriods(): Promise<PayrollPeriod[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return payrollPeriodRepository.listByCompany(companyId);
  }

  async getPeriod(id: string): Promise<PayrollPeriod> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const period = await payrollPeriodRepository.findById(id);
    if (!period || period.companyId !== companyId) {
      throw new Error('Payroll period not found');
    }

    return period;
  }

  async createPeriod(data: CreatePayrollPeriodDto): Promise<PayrollPeriod> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validatedData = createPayrollPeriodSchema.parse(data);

    // Validate month/year uniqueness
    const existing = await payrollPeriodRepository.findByCompanyAndMonth(
      companyId,
      validatedData.financialYearId,
      validatedData.year,
      validatedData.month,
    );

    if (existing) {
      throw new Error('A payroll period already exists for this month and financial year.');
    }

    if (validatedData.fromDate > validatedData.toDate) {
      throw new Error('fromDate cannot be after toDate');
    }

    return payrollPeriodRepository.create(companyId, validatedData);
  }

  async lockPeriod(id: string): Promise<PayrollPeriod> {
    const period = await this.getPeriod(id);

    // Simplistic lifecycle transition for E5.1
    if (period.status === 'Locked') {
      return period;
    }

    if (period.status !== 'Finalized') {
      throw new Error('Only finalized periods can be locked');
    }

    const updated = await payrollPeriodRepository.update(id, {
      status: 'Locked',
    });

    if (!updated) throw new Error('Failed to lock period');
    return updated;
  }

  async unlockPeriod(id: string): Promise<PayrollPeriod> {
    const period = await this.getPeriod(id);

    if (period.status !== 'Locked') {
      throw new Error('Period is not locked');
    }

    const updated = await payrollPeriodRepository.update(id, {
      status: 'Finalized',
    });

    if (!updated) throw new Error('Failed to unlock period');
    return updated;
  }
}

export const payrollPeriodService = new PayrollPeriodService();
