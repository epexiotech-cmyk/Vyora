import { randomUUID } from 'crypto';

import { customers, Customer, InsertCustomer } from '@vyora/database';
import {
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
  DocumentType,
} from '@vyora/types';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';

import { documentNumberingService } from '../services/DocumentNumberingService';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

function mapToDto(entity: Customer): CustomerProfileDto {
  return {
    id: entity.id,
    customerCode: entity.customerCode,
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
    shippingAddresses: entity.shippingAddresses as CustomerProfileDto['shippingAddresses'],
    gstin: entity.gstin,
    pan: entity.pan,
    registrationType: entity.registrationType as CustomerProfileDto['registrationType'],
    openingBalance: entity.openingBalance,
    openingType: entity.openingType as CustomerProfileDto['openingType'],
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

export class CustomerRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchCustomersOptions,
    tx?: DbTransaction,
  ): Promise<CustomerListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(customers.companyId, companyId),
      isNull(customers.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(customers.isActive, options.isActive));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = or(
        like(customers.name, q),
        like(customers.customerCode, q),
        like(customers.mobile, q),
        like(customers.gstin, q),
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
      .from(customers)
      .where(and(...validConditions));

    // Count total before pagination
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(customers)
      .where(and(...validConditions))
      .orderBy(desc(customers.createdAt))
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
  ): Promise<CustomerProfileDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, id), eq(customers.companyId, companyId), isNull(customers.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result);
  }

  public getByIdSync(id: string, companyId: string, tx: DbTransaction): CustomerProfileDto | null {
    const result = tx
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, id), eq(customers.companyId, companyId), isNull(customers.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result);
  }

  public getNextCustomerCodeSync(companyId: string, tx: TransactionExecutor): string {
    return documentNumberingService.generateNextNumberSync(
      companyId,
      DocumentType.CUSTOMER,
      '',
      tx,
    );
  }

  public async create(
    companyId: string,
    data: CreateCustomerInput & { customerCode: string },
    tx?: DbTransaction,
  ): Promise<CustomerProfileDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCustomer = {
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

    await executor.insert(customers).values(newCustomer as InsertCustomer);
    const created = await executor.select().from(customers).where(eq(customers.id, id)).get();
    return mapToDto(created!);
  }

  public createSync(
    companyId: string,
    data: CreateCustomerInput & { customerCode: string },
    tx: DbTransaction,
  ): CustomerProfileDto {
    const id = randomUUID();
    const now = new Date();

    const newCustomer = {
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

    tx.insert(customers)
      .values(newCustomer as InsertCustomer)
      .run();
    const created = tx.select().from(customers).where(eq(customers.id, id)).get();
    return mapToDto(created!);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateCustomerInput,
    tx?: DbTransaction,
  ): Promise<CustomerProfileDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Customer not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor.update(customers).set(updateData).where(eq(customers.id, id));

    const updated = await executor.select().from(customers).where(eq(customers.id, id)).get();
    return mapToDto(updated!);
  }

  public updateSync(
    id: string,
    companyId: string,
    data: UpdateCustomerInput,
    tx: DbTransaction,
  ): CustomerProfileDto {
    const now = new Date();

    const existing = this.getByIdSync(id, companyId, tx);
    if (!existing) throw new Error('Customer not found');

    const updateData = {
      ...data,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    tx.update(customers).set(updateData).where(eq(customers.id, id)).run();

    const updated = tx.select().from(customers).where(eq(customers.id, id)).get();
    return mapToDto(updated!);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Customer not found');

    await executor
      .update(customers)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(customers.id, id));
  }
}
