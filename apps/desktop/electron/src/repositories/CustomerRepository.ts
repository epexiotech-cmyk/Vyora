import { randomUUID } from 'crypto';

import { customers } from '@vyora/database';
import { Customer, InsertCustomer } from '@vyora/types';
import { desc, eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class CustomerRepository extends BaseRepository {
  public async getAll(tx?: DbTransaction): Promise<Customer[]> {
    const executor = tx || this.db;
    return await executor.select().from(customers).orderBy(desc(customers.createdAt));
  }

  public async create(
    data: Omit<InsertCustomer, 'id' | 'createdAt'>,
    tx?: DbTransaction,
  ): Promise<Customer> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCustomer = {
      ...data,
      id,
      createdAt: now,
    } as InsertCustomer;

    await executor.insert(customers).values(newCustomer);
    const created = await executor.select().from(customers).where(eq(customers.id, id)).get();
    return created as Customer;
  }
}
