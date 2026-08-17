import { randomUUID } from 'crypto';

import { products, Product, InsertProduct } from '@vyora/database';
import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  SearchProductsOptions,
  ProductListDto,
  ItemType,
  TaxabilityType,
} from '@vyora/types';
import { eq, and, or, like, desc, isNull, inArray } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

function mapToDto(entity: Product): ProductDto {
  return {
    id: entity.id,
    name: entity.name,
    sku: entity.sku,
    itemType: entity.itemType as ItemType,
    description: entity.description,
    hsnCode: entity.hsnCode,
    barcodeValue: entity.barcodeValue,
    barcodeType: entity.barcodeType,
    taxabilityType: entity.taxabilityType as TaxabilityType,
    unitId: entity.unitId,
    taxId: entity.taxId,
    salePrice: entity.salePrice,
    purchasePrice: entity.purchasePrice,
    stock: entity.stock,
    openingValuationRate: entity.openingValuationRate,
    reorderLevel: entity.reorderLevel,
    isActive: entity.isActive,
    syncVersion: entity.syncVersion,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class ProductRepository extends BaseRepository {
  public async search(
    companyId: string,
    options: SearchProductsOptions,
    tx?: DbTransaction,
  ): Promise<ProductListDto> {
    const executor = tx || this.db;

    const conditions: import('drizzle-orm').SQL<unknown>[] = [
      eq(products.companyId, companyId),
      isNull(products.deletedAt),
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(products.isActive, options.isActive));
    }

    if (options.itemTypes && options.itemTypes.length > 0) {
      conditions.push(inArray(products.itemType, options.itemTypes));
    }

    if (options.query) {
      const q = `%${options.query}%`;
      const searchCondition = or(
        like(products.name, q),
        like(products.sku, q),
        like(products.hsnCode, q),
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
      .from(products)
      .where(and(...validConditions));

    // Count total before pagination
    const allResults = await baseQuery.all();
    const total = allResults.length;

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await executor
      .select()
      .from(products)
      .where(and(...validConditions))
      .orderBy(desc(products.createdAt))
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
  ): Promise<ProductDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(products)
      .where(
        and(eq(products.id, id), eq(products.companyId, companyId), isNull(products.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result);
  }

  public getByIdSync(id: string, companyId: string, tx: TransactionExecutor): ProductDto | null {
    const executor = tx || this.db;
    const result = executor
      .select()
      .from(products)
      .where(
        and(eq(products.id, id), eq(products.companyId, companyId), isNull(products.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result as Product);
  }

  public async getByName(
    name: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<ProductDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(products)
      .where(
        and(eq(products.name, name), eq(products.companyId, companyId), isNull(products.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result as Product);
  }

  public getByNameSync(
    name: string,
    companyId: string,
    tx: TransactionExecutor,
  ): ProductDto | null {
    const executor = tx || this.db;
    const result = executor
      .select()
      .from(products)
      .where(
        and(eq(products.name, name), eq(products.companyId, companyId), isNull(products.deletedAt)),
      )
      .get();

    if (!result) return null;
    return mapToDto(result as Product);
  }

  public async create(
    companyId: string,
    data: CreateProductInput & { sku: string },
    tx?: DbTransaction,
  ): Promise<ProductDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newProduct = {
      ...data,
      id,
      companyId,
      barcodeValue: data.barcodeValue,
      barcodeType: data.barcodeType,
      taxabilityType: data.taxabilityType ?? 'Taxable',
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      salePrice: data.salePrice ?? 0,
      purchasePrice: data.purchasePrice ?? 0,
      stock: data.stock ?? 0,
      openingValuationRate: data.openingValuationRate ?? 0,
      reorderLevel: data.reorderLevel ?? 0,
    };

    await executor.insert(products).values(newProduct as InsertProduct);
    const created = await executor.select().from(products).where(eq(products.id, id)).get();
    return mapToDto(created!);
  }

  public createSync(
    companyId: string,
    data: CreateProductInput & { sku: string },
    tx: TransactionExecutor,
  ): ProductDto {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newProduct = {
      ...data,
      id,
      companyId,
      barcodeValue: data.barcodeValue,
      barcodeType: data.barcodeType,
      taxabilityType: data.taxabilityType ?? 'Taxable',
      isActive: data.isActive ?? true,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      salePrice: data.salePrice ?? 0,
      purchasePrice: data.purchasePrice ?? 0,
      stock: data.stock ?? 0,
      openingValuationRate: data.openingValuationRate ?? 0,
      reorderLevel: data.reorderLevel ?? 0,
    };

    executor
      .insert(products)
      .values(newProduct as InsertProduct)
      .run();
    const created = executor.select().from(products).where(eq(products.id, id)).get();
    return mapToDto(created as Product);
  }

  public async update(
    id: string,
    companyId: string,
    data: UpdateProductInput,
    tx?: DbTransaction,
  ): Promise<ProductDto> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Product not found');

    // Exclude id from data payload if passed
    const restData = { ...data };
    delete (restData as Partial<UpdateProductInput>).id;

    const updateData = {
      ...restData,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    await executor
      .update(products)
      .set(updateData as Partial<InsertProduct>)
      .where(eq(products.id, id));

    const updated = await executor.select().from(products).where(eq(products.id, id)).get();
    return mapToDto(updated!);
  }

  public updateSync(
    id: string,
    companyId: string,
    data: UpdateProductInput,
    tx: TransactionExecutor,
  ): ProductDto {
    const executor = tx || this.db;
    const now = new Date();

    const existing = this.getByIdSync(id, companyId, executor);
    if (!existing) throw new Error('Product not found');

    // Exclude id from data payload if passed
    const restData = { ...data };
    delete (restData as Partial<UpdateProductInput>).id;

    const updateData = {
      ...restData,
      syncVersion: existing.syncVersion + 1,
      updatedAt: now,
    };

    executor
      .update(products)
      .set(updateData as Partial<InsertProduct>)
      .where(eq(products.id, id))
      .run();

    const updated = executor.select().from(products).where(eq(products.id, id)).get();
    return mapToDto(updated as Product);
  }

  public async deactivate(id: string, companyId: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();

    const existing = await this.getById(id, companyId, tx);
    if (!existing) throw new Error('Product not found');

    await executor
      .update(products)
      .set({
        deletedAt: now,
        isActive: false,
        syncVersion: existing.syncVersion + 1,
        updatedAt: now,
      })
      .where(eq(products.id, id));
  }

  public async hasProductsWithUnit(
    unitId: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<boolean> {
    const executor = tx || this.db;
    const result = await executor
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.unitId, unitId),
          eq(products.companyId, companyId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1)
      .get();
    return !!result;
  }

  public async hasProductsWithTax(
    taxId: string,
    companyId: string,
    tx?: DbTransaction,
  ): Promise<boolean> {
    const executor = tx || this.db;
    const result = await executor
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.taxId, taxId),
          eq(products.companyId, companyId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1)
      .get();
    return !!result;
  }
}
