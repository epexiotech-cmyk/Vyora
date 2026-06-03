import { randomUUID } from 'crypto';

import { customers, Customer, InsertCustomer } from '@vyora/database';
import { CustomerDto } from '@vyora/types';
import { desc, eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Customer): CustomerDto {
  return {
    id: entity.id,
    name: entity.name,
    gstin: entity.gstin,
    mobile: entity.mobile,
    email: entity.email,
    city: entity.city,
    state: entity.state,
    balance: entity.balance,
    createdAt: entity.createdAt,
  };
}

export class CustomerRepository extends BaseRepository {
  public async getAll(tx?: DbTransaction): Promise<CustomerDto[]> {
    const executor = tx || this.db;
    const results = await executor.select().from(customers).orderBy(desc(customers.createdAt));
    return results.map(mapToDto);
  }

  public async create(
    data: Omit<InsertCustomer, 'id' | 'createdAt'>,
    tx?: DbTransaction,
  ): Promise<CustomerDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCustomer = {
      ...data,
      id,
      createdAt: now,
    };

    await executor.insert(customers).values(newCustomer as InsertCustomer);
    const created = await executor.select().from(customers).where(eq(customers.id, id)).get();
    return mapToDto(created!);
  }
}
