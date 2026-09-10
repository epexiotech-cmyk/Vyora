import { payroll_structure_inputs, InsertPayrollStructureInput } from '@vyora/database';

import { BaseRepository } from './BaseRepository';

export class PayrollStructureInputRepository extends BaseRepository {
  public async create(data: InsertPayrollStructureInput) {
    const [result] = await this.db.insert(payroll_structure_inputs).values(data).returning();
    return result;
  }
}

export const payrollStructureInputRepository = new PayrollStructureInputRepository();
