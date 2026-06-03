import { randomUUID } from 'crypto';

import { products, Product, InsertProduct } from '@vyora/database';
import { ProductDto } from '@vyora/types';
import { desc, eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Product): ProductDto {
  return {
    id: entity.id,
    name: entity.name,
    sku: entity.sku,
    hsnCode: entity.hsnCode,
    unitId: entity.unitId,
    taxId: entity.taxId,
    salePrice: entity.salePrice,
    purchasePrice: entity.purchasePrice,
    stock: entity.stock,
    createdAt: entity.createdAt,
  };
}

export class ProductRepository extends BaseRepository {
  public async getAll(tx?: DbTransaction): Promise<ProductDto[]> {
    const executor = tx || this.db;
    const results = await executor.select().from(products).orderBy(desc(products.createdAt));
    return results.map(mapToDto);
  }

  public async create(
    data: Omit<InsertProduct, 'id' | 'createdAt'>,
    tx?: DbTransaction,
  ): Promise<ProductDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newProduct = {
      ...data,
      id,
      createdAt: now,
    };

    await executor.insert(products).values(newProduct as InsertProduct);
    const created = await executor.select().from(products).where(eq(products.id, id)).get();
    return mapToDto(created!);
  }
}
