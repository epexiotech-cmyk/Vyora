import { randomUUID } from 'crypto';

import {
  EmployeeSalaryStructure,
  EmployeeSalaryStructureLine,
  InsertEmployeeSalaryStructure,
  InsertEmployeeSalaryStructureLine,
  employee_salary_structure_lines,
  employee_salary_structures,
} from '@vyora/database';
import { and, desc, eq } from 'drizzle-orm';

import { companyContextService } from '../services/CompanyContextService';

import { BaseRepository, DbTransaction } from './BaseRepository';

export type PopulatedSalaryStructure = EmployeeSalaryStructure & {
  lines: EmployeeSalaryStructureLine[];
};

export class EmployeeSalaryStructureRepository extends BaseRepository {
  public async getById(id: string): Promise<PopulatedSalaryStructure | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const structure = await this.db
      .select()
      .from(employee_salary_structures)
      .where(
        and(
          eq(employee_salary_structures.id, id),
          eq(employee_salary_structures.companyId, companyId),
        ),
      )
      .get();

    if (!structure) return null;

    const lines = await this.db
      .select()
      .from(employee_salary_structure_lines)
      .where(
        and(
          eq(employee_salary_structure_lines.structureId, id),
          eq(employee_salary_structure_lines.companyId, companyId),
        ),
      )
      .orderBy(employee_salary_structure_lines.displayOrder);

    return { ...structure, lines };
  }

  public async getByEmployeeId(employeeId: string): Promise<PopulatedSalaryStructure[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const structures = await this.db
      .select()
      .from(employee_salary_structures)
      .where(
        and(
          eq(employee_salary_structures.employeeId, employeeId),
          eq(employee_salary_structures.companyId, companyId),
        ),
      )
      .orderBy(desc(employee_salary_structures.effectiveFrom));

    const populated: PopulatedSalaryStructure[] = [];

    for (const struct of structures) {
      const lines = await this.db
        .select()
        .from(employee_salary_structure_lines)
        .where(
          and(
            eq(employee_salary_structure_lines.structureId, struct.id),
            eq(employee_salary_structure_lines.companyId, companyId),
          ),
        )
        .orderBy(employee_salary_structure_lines.displayOrder);
      populated.push({ ...struct, lines });
    }

    return populated;
  }

  public async getLatestByEmployeeId(
    employeeId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeSalaryStructure | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const executor = tx ?? this.db;
    const structure = await executor
      .select()
      .from(employee_salary_structures)
      .where(
        and(
          eq(employee_salary_structures.employeeId, employeeId),
          eq(employee_salary_structures.companyId, companyId),
        ),
      )
      .orderBy(desc(employee_salary_structures.effectiveFrom))
      .limit(1)
      .get();

    return structure || null;
  }

  public async create(
    data: Omit<
      InsertEmployeeSalaryStructure,
      | 'id'
      | 'companyId'
      | 'syncVersion'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'effectiveTo'
    >,
    linesData: Omit<
      InsertEmployeeSalaryStructureLine,
      'id' | 'companyId' | 'structureId' | 'createdAt' | 'updatedAt'
    >[],
  ): Promise<PopulatedSalaryStructure> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return this.transaction(async (tx) => {
      const latest = await this.getLatestByEmployeeId(data.employeeId, tx);

      if (latest) {
        if (data.effectiveFrom <= latest.effectiveFrom) {
          throw new Error(
            'New structure effectiveFrom must be strictly later than current structure effectiveFrom',
          );
        }

        // Adjust effectiveTo of latest structure to be 1 day before the new one
        const previousEnd = new Date(data.effectiveFrom);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousEnd.setHours(23, 59, 59, 999);

        await tx
          .update(employee_salary_structures)
          .set({
            effectiveTo: previousEnd,
            updatedAt: new Date(),
            syncVersion: latest.syncVersion + 1,
          })
          .where(
            and(
              eq(employee_salary_structures.id, latest.id),
              eq(employee_salary_structures.companyId, companyId),
            ),
          );
      }

      const now = new Date();
      const newStructureId = randomUUID();

      await tx.insert(employee_salary_structures).values({
        id: newStructureId,
        companyId,
        employeeId: data.employeeId,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        syncVersion: 1,
      });

      for (const line of linesData) {
        await tx.insert(employee_salary_structure_lines).values({
          id: randomUUID(),
          companyId,
          structureId: newStructureId,
          salaryComponentId: line.salaryComponentId,
          amount: line.amount,
          percentage: line.percentage,
          displayOrder: line.displayOrder,
          createdAt: now,
          updatedAt: now,
        });
      }

      const structureResult = await tx
        .select()
        .from(employee_salary_structures)
        .where(
          and(
            eq(employee_salary_structures.id, newStructureId),
            eq(employee_salary_structures.companyId, companyId),
          ),
        )
        .get();

      const linesResult = await tx
        .select()
        .from(employee_salary_structure_lines)
        .where(
          and(
            eq(employee_salary_structure_lines.structureId, newStructureId),
            eq(employee_salary_structure_lines.companyId, companyId),
          ),
        )
        .orderBy(employee_salary_structure_lines.displayOrder);

      return {
        ...structureResult!,
        lines: linesResult,
      };
    });
  }
}

export const employeeSalaryStructureRepository = new EmployeeSalaryStructureRepository();
