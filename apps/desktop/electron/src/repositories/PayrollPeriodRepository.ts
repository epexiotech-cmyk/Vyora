import { randomUUID } from 'crypto';

import { payroll_periods } from '@vyora/database';
import { PayrollPeriod, CreatePayrollPeriodDto, UpdatePayrollPeriodDto } from '@vyora/types';
import { and, eq, desc } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

export class PayrollPeriodRepository extends BaseRepository {
  async findById(id: string): Promise<PayrollPeriod | undefined> {
    return this.db.query.payroll_periods.findFirst({
      where: eq(payroll_periods.id, id),
    });
  }

  async findByCompanyAndMonth(
    companyId: string,
    financialYearId: string,
    year: number,
    month: number,
  ): Promise<PayrollPeriod | undefined> {
    return this.db.query.payroll_periods.findFirst({
      where: and(
        eq(payroll_periods.companyId, companyId),
        eq(payroll_periods.financialYearId, financialYearId),
        eq(payroll_periods.year, year),
        eq(payroll_periods.month, month),
      ),
    });
  }

  async listByCompany(companyId: string): Promise<PayrollPeriod[]> {
    return this.db.query.payroll_periods.findMany({
      where: eq(payroll_periods.companyId, companyId),
      orderBy: [desc(payroll_periods.year), desc(payroll_periods.month)],
    });
  }

  async create(companyId: string, data: CreatePayrollPeriodDto): Promise<PayrollPeriod> {
    const newPeriod = {
      id: randomUUID(),
      companyId,
      financialYearId: data.financialYearId,
      month: data.month,
      year: data.year,
      fromDate: data.fromDate,
      toDate: data.toDate,
      status: 'Draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncVersion: 1,
    };

    await this.db.insert(payroll_periods).values(newPeriod);
    return newPeriod as PayrollPeriod;
  }

  async update(id: string, data: UpdatePayrollPeriodDto): Promise<PayrollPeriod | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const updates = {
      ...data,
      updatedAt: new Date(),
      syncVersion: existing.syncVersion + 1,
    };

    const result = await this.db
      .update(payroll_periods)
      .set(updates)
      .where(eq(payroll_periods.id, id))
      .returning();

    return result[0] as PayrollPeriod | undefined;
  }
}

export const payrollPeriodRepository = new PayrollPeriodRepository();
