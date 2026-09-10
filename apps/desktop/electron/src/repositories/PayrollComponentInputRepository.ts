import { payroll_component_inputs, InsertPayrollComponentInput } from '@vyora/database';

import { BaseRepository } from './BaseRepository';

export class PayrollComponentInputRepository extends BaseRepository {
  public async createMany(data: InsertPayrollComponentInput[]) {
    if (data.length === 0) return [];

    return this.db.insert(payroll_component_inputs).values(data).returning();
  }
}

export const payrollComponentInputRepository = new PayrollComponentInputRepository();
