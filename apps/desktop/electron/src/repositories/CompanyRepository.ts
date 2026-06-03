import { randomUUID } from 'crypto';

import { companies, Company, InsertCompany } from '@vyora/database';
import { CompanyDto } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Company): CompanyDto {
  return {
    id: entity.id,
    name: entity.name,
    gstin: entity.gstin,
    address: entity.address,
    phone: entity.phone,
    email: entity.email,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class CompanyRepository extends BaseRepository {
  public async getFirst(tx?: DbTransaction): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const result = await executor.select().from(companies).get();
    return result ? mapToDto(result) : undefined;
  }

  public async getById(id: string, tx?: DbTransaction): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const result = await executor.select().from(companies).where(eq(companies.id, id)).get();
    return result ? mapToDto(result) : undefined;
  }

  public async create(
    data: Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): Promise<CompanyDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCompany = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await executor.insert(companies).values(newCompany as InsertCompany);
    const created = await executor.select().from(companies).where(eq(companies.id, id)).get();
    return mapToDto(created!);
  }
}
