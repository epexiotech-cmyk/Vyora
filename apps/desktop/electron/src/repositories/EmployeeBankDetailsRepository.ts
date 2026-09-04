import { randomUUID } from 'crypto';

import {
  employee_bank_details,
  InsertEmployeeBankDetail,
  EmployeeBankDetail,
} from '@vyora/database';
import {
  EmployeeBankDetailDto,
  CreateEmployeeBankDetailInput,
  UpdateEmployeeBankDetailInput,
} from '@vyora/types';
import { eq, and, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: EmployeeBankDetail): EmployeeBankDetailDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    employeeId: entity.employeeId,
    bankName: entity.bankName,
    accountHolderName: entity.accountHolderName,
    accountNumber: entity.accountNumber,
    ifscCode: entity.ifscCode,
    branchName: entity.branchName,
    isPrimary: entity.isPrimary,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class EmployeeBankDetailsRepository extends BaseRepository {
  public async getByEmployeeId(
    employeeId: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeBankDetailDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(employee_bank_details)
      .where(
        and(
          eq(employee_bank_details.employeeId, employeeId),
          eq(employee_bank_details.companyId, companyId),
          isNull(employee_bank_details.deletedAt),
        ),
      )
      .orderBy(desc(employee_bank_details.createdAt))
      .all();

    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeBankDetailDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_bank_details)
      .where(
        and(
          eq(employee_bank_details.id, id),
          eq(employee_bank_details.companyId, companyId),
          isNull(employee_bank_details.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    employeeId: string,
    companyId: string,
    data: CreateEmployeeBankDetailInput,
  ): Promise<EmployeeBankDetailDto> {
    return this.transaction(async (tx) => {
      const id = randomUUID();
      const now = new Date();

      if (data.isPrimary) {
        await tx
          .update(employee_bank_details)
          .set({ isPrimary: false, updatedAt: now })
          .where(
            and(
              eq(employee_bank_details.employeeId, employeeId),
              eq(employee_bank_details.companyId, companyId),
            ),
          );
      }

      const insertData: InsertEmployeeBankDetail = {
        id,
        companyId,
        employeeId,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branchName: data.branchName ?? null,
        isPrimary: data.isPrimary ?? false,
        isActive: data.isActive ?? true,
        syncVersion: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      await tx.insert(employee_bank_details).values(insertData);

      const created = await tx
        .select()
        .from(employee_bank_details)
        .where(eq(employee_bank_details.id, id))
        .get();
      return mapToDto(created!);
    });
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeBankDetailInput,
  ): Promise<EmployeeBankDetailDto> {
    return this.transaction(async (tx) => {
      const now = new Date();

      const existing = await this.getById(id, companyId, tx);
      if (!existing) throw new Error('Bank detail not found');

      if (data.isPrimary) {
        await tx
          .update(employee_bank_details)
          .set({ isPrimary: false, updatedAt: now })
          .where(
            and(
              eq(employee_bank_details.employeeId, existing.employeeId),
              eq(employee_bank_details.companyId, companyId),
            ),
          );
      }

      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );

      const updateData = {
        ...cleanData,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      };

      await tx
        .update(employee_bank_details)
        .set(updateData as Partial<InsertEmployeeBankDetail>)
        .where(eq(employee_bank_details.id, id));

      const updated = await tx
        .select()
        .from(employee_bank_details)
        .where(eq(employee_bank_details.id, id))
        .get();
      return mapToDto(updated!);
    });
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Bank detail not found');

    await executor
      .update(employee_bank_details)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(employee_bank_details.id, id));
  }
}
