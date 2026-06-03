import { randomUUID } from 'crypto';

import { products } from '@vyora/database';
import { Product, InsertProduct } from '@vyora/types';
import { desc, eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class ProductRepository extends BaseRepository {
  public async getAll(tx?: DbTransaction): Promise<Product[]> {
    const executor = tx || this.db;
    return await executor.select().from(products).orderBy(desc(products.createdAt));
  }

  public async create(
    data: Omit<InsertProduct, 'id' | 'createdAt'>,
    tx?: DbTransaction,
  ): Promise<Product> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newProduct = {
      ...data,
      id,
      createdAt: now,
    } as InsertProduct;

    await executor.insert(products).values(newProduct);
    const created = await executor.select().from(products).where(eq(products.id, id)).get();
    return created as Product;
  }
}
