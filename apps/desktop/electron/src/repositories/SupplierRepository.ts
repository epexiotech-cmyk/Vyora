import { randomUUID } from 'crypto';

import { suppliers, Supplier } from '@vyora/database';
import {
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
} from '@vyora/types';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Supplier): SupplierProfileDto {
  return {
    id: entity.id,
    supplierCode: entity.supplierCode,
    name: entity.name,
    contactPerson: entity.contactPerson,
    mobile: entity.mobile,
    alternateMobile: entity.alternateMobile,
    email: entity.email,
    addressLine1: entity.addressLine1,
    addressLine2: entity.addressLine2,
    area: entity.area,
    city: entity.city,
    state: entity.state,
    pincode: entity.pincode,
    gstin: entity.gstin,
    pan: entity.pan,
    registrationType: entity.registrationType as SupplierProfileDto['registrationType'],
    openingBalance: entity.openingBalance,
    openingType: entity.openingType as SupplierProfileDto['openingType'],
    creditLimit: entity.creditLimit,
    creditDays: entity.creditDays,
    notes: entity.notes,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class SupplierRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchSuppliersOptions,
    tx?: DbTransaction,
  ): Promise<SupplierListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(suppliers.companyId, companyId),
      isNull(suppliers.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(suppliers.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = or(
        like(suppliers.name, q),
        like(suppliers.supplierCode, q),
        like(suppliers.mobile, q),
        like(suppliers.gstin, q),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const validConditions = conditions.filter(
      (c) => c !== undefined,
    ) as import('drizzle-orm').SQL<unknown>[];
    const baseQuery = executor
      .select()
      .from(suppliers)
      .where(and(...validConditions));

    // Count total before pagination
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(suppliers)
      .where(and(...validConditions))
      .orderBy(desc(suppliers.createdAt))
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
  ): Promise<SupplierProfileDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, id), eq(suppliers.companyId, companyId), isNull(suppliers.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result);
  }

  public async create(
    companyId: string,
    data: CreateSupplierInput & { supplierCode: string },
    tx?: DbTransaction,
  ): Promise<SupplierProfileDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newSupplier = {
      ...data,
      id,
      companyId,
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      openingBalance: data.openingBalance ?? 0,
      creditLimit: data.creditLimit ?? 0,
      creditDays: data.creditDays ?? 0,
    };

    await executor.insert(suppliers).values(newSupplier);
    const created = await executor.select().from(suppliers).where(eq(suppliers.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateSupplierInput,
    tx?: DbTransaction,
  ): Promise<SupplierProfileDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Supplier not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor.update(suppliers).set(updateData).where(eq(suppliers.id, id));

    const updated = await executor.select().from(suppliers).where(eq(suppliers.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Supplier not found');

    await executor
      .update(suppliers)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(suppliers.id, id));
  }
}
