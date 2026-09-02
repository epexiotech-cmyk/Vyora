import { randomUUID } from 'crypto';

import { suppliers, Supplier } from '@vyora/database';
import {
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
} from '@vyora/types';
import { DocumentType } from '@vyora/types';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';

import { documentNumberingService } from '../services/DocumentNumberingService';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

function mapToDto(entity: Supplier): SupplierProfileDto {
  return {
    id: entity.id,
    supplierCode: entity.supplierCode,
    name: entity.name,
    contactPerson: entity.contactPerson,
    mobile: entity.mobile,
    alternateMobile: entity.alternateMobile,
    landline: entity.landline,
    email: entity.email,
    addressLine1: entity.addressLine1,
    addressLine2: entity.addressLine2,
    area: entity.area,
    city: entity.city,
    state: entity.state,
    district: entity.district,
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
    isSystem: entity.isSystem,
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

  public getByIdSync(
    id: string,
    companyId: string,
    tx: TransactionExecutor,
  ): SupplierProfileDto | null {
    const result = tx
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, id), eq(suppliers.companyId, companyId), isNull(suppliers.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result as Supplier);
  }

  public getSystemSupplierSync(
    companyId: string,
    tx: TransactionExecutor,
  ): SupplierProfileDto | null {
    const result = tx
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.companyId, companyId),
          eq(suppliers.isSystem, true),
          isNull(suppliers.deletedAt),
        ),
      )
      .get();

    if (!result) return null;
    return mapToDto(result as Supplier);
  }

  public getNextSupplierCodeSync(companyId: string, tx: TransactionExecutor): string {
    return documentNumberingService.generateNextNumberSync(
      companyId,
      DocumentType.SUPPLIER,
      null,
      tx,
    );
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
      isSystem: data.isSystem ?? false,
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

  public createSync(
    companyId: string,
    data: CreateSupplierInput & { supplierCode: string },
    tx: TransactionExecutor,
  ): SupplierProfileDto {
    const id = randomUUID();
    const now = new Date();

    const newSupplier = {
      ...data,
      id,
      companyId,
      isActive: data.isActive ?? true,
      isSystem: data.isSystem ?? false,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      openingBalance: data.openingBalance ?? 0,
      creditLimit: data.creditLimit ?? 0,
      creditDays: data.creditDays ?? 0,
    };

    tx.insert(suppliers).values(newSupplier).run();
    const created = tx.select().from(suppliers).where(eq(suppliers.id, id)).get();
    return mapToDto(created as Supplier);
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

  public updateSync(
    id: string,
    companyId: string,
    data: UpdateSupplierInput,
    tx: TransactionExecutor,
  ): SupplierProfileDto {
    const now = new Date();

    const existing = this.getByIdSync(id, companyId, tx);
    if (!existing) throw new Error('Supplier not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    tx.update(suppliers).set(updateData).where(eq(suppliers.id, id)).run();

    const updated = tx.select().from(suppliers).where(eq(suppliers.id, id)).get();
    return mapToDto(updated as Supplier);
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
