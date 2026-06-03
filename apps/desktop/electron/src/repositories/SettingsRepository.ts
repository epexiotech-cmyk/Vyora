import { randomUUID } from 'crypto';

import { app_settings, company_settings } from '@vyora/database';
import { CompanySetting, InsertCompanySetting } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  // --- App Settings ---

  public async getAppSetting(key: string, tx?: DbTransaction): Promise<string | undefined> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(app_settings)
      .where(eq(app_settings.key, key))
      .get();
    return result?.value;
  }

  public async setAppSetting(key: string, value: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const existing = await this.getAppSetting(key, tx);

    if (existing !== undefined) {
      await executor.update(app_settings).set({ value }).where(eq(app_settings.key, key));
    } else {
      await executor.insert(app_settings).values({ key, value });
    }
  }

  // --- Company Settings ---

  public async getCompanySettings(
    companyId: string,
    tx?: DbTransaction,
  ): Promise<CompanySetting | undefined> {
    const executor = tx || this.db;
    return await executor
      .select()
      .from(company_settings)
      .where(eq(company_settings.companyId, companyId))
      .get();
  }

  public async createCompanySettings(
    data: Omit<InsertCompanySetting, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): Promise<CompanySetting> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newSettings = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as InsertCompanySetting;

    await executor.insert(company_settings).values(newSettings);
    const created = await executor
      .select()
      .from(company_settings)
      .where(eq(company_settings.id, id))
      .get();
    return created as CompanySetting;
  }
}
