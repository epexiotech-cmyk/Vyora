import { randomUUID } from 'crypto';

import { employee_documents, InsertEmployeeDocument, EmployeeDocument } from '@vyora/database';
import {
  EmployeeDocumentDto,
  CreateEmployeeDocumentInput,
  UpdateEmployeeDocumentInput,
} from '@vyora/types';
import { eq, and, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: EmployeeDocument): EmployeeDocumentDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    employeeId: entity.employeeId,
    documentCategory: entity.documentCategory,
    documentName: entity.documentName,
    documentNumber: entity.documentNumber,
    filePath: entity.filePath,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class EmployeeDocumentRepository extends BaseRepository {
  public async getByEmployeeId(
    employeeId: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeDocumentDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(employee_documents)
      .where(
        and(
          eq(employee_documents.employeeId, employeeId),
          eq(employee_documents.companyId, companyId),
          isNull(employee_documents.deletedAt),
        ),
      )
      .orderBy(desc(employee_documents.createdAt))
      .all();

    return results.map(mapToDto);
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeDocumentDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employee_documents)
      .where(
        and(
          eq(employee_documents.id, id),
          eq(employee_documents.companyId, companyId),
          isNull(employee_documents.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    employeeId: string,
    companyId: string,
    data: CreateEmployeeDocumentInput,
    tx?: DbTransaction,
  ): Promise<EmployeeDocumentDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertEmployeeDocument = {
      id,
      companyId,
      employeeId,
      documentCategory: data.documentCategory,
      documentName: data.documentName,
      documentNumber: data.documentNumber ?? null,
      filePath: data.filePath,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(employee_documents).values(insertData);

    const created = await executor
      .select()
      .from(employee_documents)
      .where(eq(employee_documents.id, id))
      .get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeDocumentInput,
    tx?: DbTransaction,
  ): Promise<EmployeeDocumentDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Document not found');

    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

    const updateData = {
      ...cleanData,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(employee_documents)
      .set(updateData as Partial<InsertEmployeeDocument>)
      .where(eq(employee_documents.id, id));

    const updated = await executor
      .select()
      .from(employee_documents)
      .where(eq(employee_documents.id, id))
      .get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Document not found');

    await executor
      .update(employee_documents)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(employee_documents.id, id));
  }
}
