import { randomUUID } from 'crypto';

import { companies } from '@vyora/database';
import { Company, InsertCompany } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class CompanyRepository extends BaseRepository {
  public async getFirst(tx?: DbTransaction): Promise<Company | undefined> {
    const executor = tx || this.db;
    return await executor.select().from(companies).get();
  }

  public async getById(id: string, tx?: DbTransaction): Promise<Company | undefined> {
    const executor = tx || this.db;
    return await executor.select().from(companies).where(eq(companies.id, id)).get();
  }

  public async create(
    data: Omit<InsertCompany, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): Promise<Company> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCompany = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as InsertCompany;

    await executor.insert(companies).values(newCompany);
    const created = await executor.select().from(companies).where(eq(companies.id, id)).get();
    return created as Company;
  }
}
