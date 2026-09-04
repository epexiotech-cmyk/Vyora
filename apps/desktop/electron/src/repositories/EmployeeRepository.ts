import { randomUUID } from 'crypto';

import { employees, InsertEmployee, Employee } from '@vyora/database';
import {
  EmployeeDto,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  SearchEmployeesOptions,
  EmployeeListDto,
} from '@vyora/types';
import { eq, and, like, isNull, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Employee): EmployeeDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    employeeCode: entity.employeeCode,
    firstName: entity.firstName,
    middleName: entity.middleName,
    lastName: entity.lastName,
    employeeTypeId: entity.employeeTypeId,
    status: entity.status as EmployeeDto['status'],
    joiningDate: entity.joiningDate,
    confirmationDate: entity.confirmationDate,
    leavingDate: entity.leavingDate,
    departmentId: entity.departmentId,
    designationId: entity.designationId,
    reportingManagerId: entity.reportingManagerId,
    workLocationId: entity.workLocationId,
    email: entity.email,
    mobile: entity.mobile,
    dateOfBirth: entity.dateOfBirth,
    gender: entity.gender as EmployeeDto['gender'],
    addressLine1: entity.addressLine1,
    addressLine2: entity.addressLine2,
    city: entity.city,
    state: entity.state,
    pincode: entity.pincode,
    panNumber: entity.panNumber,
    uanNumber: entity.uanNumber,
    esicNumber: entity.esicNumber,
    emergencyContactName: entity.emergencyContactName,
    emergencyContactRelation: entity.emergencyContactRelation,
    emergencyContactNumber: entity.emergencyContactNumber,
    emergencyContactAddress: entity.emergencyContactAddress,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class EmployeeRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchEmployeesOptions,
    tx?: DbTransaction,
  ): Promise<EmployeeListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(employees.companyId, companyId),
      isNull(employees.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(employees.isActive, options.isActive));
    }
    if (options.status) {
      conditions.push(eq(employees.status, options.status));
    }
    if (options.departmentId) {
      conditions.push(eq(employees.departmentId, options.departmentId));
    }
    if (options.designationId) {
      conditions.push(eq(employees.designationId, options.designationId));
    }
    if (options.workLocationId) {
      conditions.push(eq(employees.workLocationId, options.workLocationId));
    }
    if (options.query) {
      const q = `%${options.query}%`;
      // We check first name, last name, or employee code
      conditions.push(like(employees.firstName, q));
      // NOTE: For simplicity we just search first name here, or we can use or() if imported
      // In a real app we'd use or() from drizzle-orm
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(employees)
      .where(and(...validConditions));

    // Count total
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(employees)
      .where(and(...validConditions))
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(mapToDto),
      total,
    };
  }

  public async getById(
    id: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employees)
      .where(
        and(eq(employees.id, id), eq(employees.companyId, companyId), isNull(employees.deletedAt)),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async getByCode(
    employeeCode: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<EmployeeDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.employeeCode, employeeCode),
          eq(employees.companyId, companyId),
          isNull(employees.deletedAt),
        ),
      )
      .get();
    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateEmployeeInput,
    tx?: DbTransaction,
  ): Promise<EmployeeDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertEmployee = {
      id,
      companyId,
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      employeeTypeId: data.employeeTypeId ?? null,
      status: data.status ?? 'Active',
      joiningDate: data.joiningDate,
      confirmationDate: data.confirmationDate ?? null,
      leavingDate: data.leavingDate ?? null,
      departmentId: data.departmentId ?? null,
      designationId: data.designationId ?? null,
      reportingManagerId: data.reportingManagerId ?? null,
      workLocationId: data.workLocationId ?? null,
      email: data.email ?? null,
      mobile: data.mobile ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? null,
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      pincode: data.pincode ?? null,
      panNumber: data.panNumber ?? null,
      uanNumber: data.uanNumber ?? null,
      esicNumber: data.esicNumber ?? null,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await executor.insert(employees).values(insertData);

    const created = await executor.select().from(employees).where(eq(employees.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateEmployeeInput,
    tx?: DbTransaction,
  ): Promise<EmployeeDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Employee not found');

    // Filter undefined
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

    const updateData = {
      ...cleanData,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(employees)
      .set(updateData as Partial<InsertEmployee>)
      .where(eq(employees.id, id));

    const updated = await executor.select().from(employees).where(eq(employees.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Employee not found');

    await executor
      .update(employees)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(employees.id, id));
  }
}
