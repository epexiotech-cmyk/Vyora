import { randomUUID } from 'crypto';

import { taxes } from '@vyora/database';
import { CreateTaxInput, TaxDto, TaxType, UpdateTaxInput } from '@vyora/types';
import { eq, and } from 'drizzle-orm';

type DbTax = typeof taxes.$inferSelect;

import { BaseRepository } from './BaseRepository';

export class TaxRepository extends BaseRepository {
  private mapToDto(row: DbTax): TaxDto {
    return {
      id: row.id,
      name: row.name,
      rate: row.rate,
      taxType: row.taxType as TaxType,
      isActive: row.isActive,
      createdAt: row.createdAt,
    };
  }

  public async findAllByCompany(companyId: string): Promise<TaxDto[]> {
    const results = await this.db.select().from(taxes).where(eq(taxes.companyId, companyId)).all();
    return results.map((row) => this.mapToDto(row));
  }

  public async getById(id: string, companyId: string): Promise<TaxDto | null> {
    const result = await this.db
      .select()
      .from(taxes)
      .where(and(eq(taxes.id, id), eq(taxes.companyId, companyId)))
      .get();
    if (!result) return null;
    return this.mapToDto(result);
  }

  public async create(data: CreateTaxInput): Promise<TaxDto> {
    const id = randomUUID();
    const now = new Date();

    const insertData = {
      id,
      companyId: data.companyId,
      name: data.name,
      rate: data.rate,
      taxType: data.taxType || 'GST',
      isActive: data.isActive ?? true,
      createdAt: now,
    };

    await this.db.insert(taxes).values(insertData);

    const created = await this.db.select().from(taxes).where(eq(taxes.id, id)).get();

    if (!created) throw new Error('Failed to create tax');
    return this.mapToDto(created);
  }

  public async update(data: UpdateTaxInput): Promise<TaxDto> {
    const updateData: Partial<DbTax> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.taxType !== undefined) updateData.taxType = data.taxType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await this.db.update(taxes).set(updateData).where(eq(taxes.id, data.id));

    const updated = await this.db.select().from(taxes).where(eq(taxes.id, data.id)).get();

    if (!updated) throw new Error('Failed to update tax');
    return this.mapToDto(updated);
  }
}
