import { payroll_results, InsertPayrollResult } from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

export class PayrollResultRepository extends BaseRepository {
  public async create(data: InsertPayrollResult) {
    const [result] = await this.db.insert(payroll_results).values(data).returning();
    return result;
  }

  public async getByPeriodAndEmployee(payrollPeriodId: string, employeeId: string) {
    const [result] = await this.db
      .select()
      .from(payroll_results)
      .where(
        and(
          eq(payroll_results.payrollPeriodId, payrollPeriodId),
          eq(payroll_results.employeeId, employeeId),
        ),
      )
      .limit(1);
    return result || null;
  }
}

export const payrollResultRepository = new PayrollResultRepository();
