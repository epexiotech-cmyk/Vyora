import { randomUUID } from 'crypto';

import { companies, Company, InsertCompany } from '@vyora/database';
import { CompanyDto } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Company): CompanyDto {
  return {
    id: entity.id,
    legalName: entity.legalName,
    tradeName: entity.tradeName,
    gstin: entity.gstin,
    pan: entity.pan,
    constitutionType: entity.constitutionType,
    businessType: entity.businessType,
    addressLine1: entity.addressLine1,
    addressLine2: entity.addressLine2,
    city: entity.city,
    district: entity.district,
    stateCode: entity.stateCode,
    countryCode: entity.countryCode,
    pincode: entity.pincode,
    email: entity.email,
    mobile: entity.mobile,
    telephone: entity.telephone,
    website: entity.website,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
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

  public createSync(
    data: Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): CompanyDto {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCompany = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    executor
      .insert(companies)
      .values(newCompany as InsertCompany)
      .run();
    const created = executor.select().from(companies).where(eq(companies.id, id)).get();
    return mapToDto(created!);
  }

  public async updateProfile(
    id: string,
    data: Partial<Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
    tx?: DbTransaction,
  ): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const now = new Date();

    const updateData = {
      ...data,
      updatedAt: now,
    };

    await executor.update(companies).set(updateData).where(eq(companies.id, id));

    return this.getById(id, tx);
  }
}
