import { currencyMaster, VyoraDatabase } from '@vyora/database';
import { eq, like, count, or, and } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export class CurrencyRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryDatabaseService.getDb();
  }

  async findByCode(code: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(currencyMaster)
        .where(and(eq(currencyMaster.isActive, true), eq(currencyMaster.currencyCode, code)))
        .get();
    });
  }

  async search(query: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(currencyMaster)
        .where(
          and(
            eq(currencyMaster.isActive, true),
            or(
              like(currencyMaster.currencyName, `%${query}%`),
              like(currencyMaster.currencyCode, `${query}%`),
            ),
          ),
        )
        .limit(50)
        .all();
    });
  }

  async count() {
    return directoryDatabaseService.execute(async (db) => {
      const result = await db
        .select({ count: count() })
        .from(currencyMaster)
        .where(eq(currencyMaster.isActive, true))
        .get();
      return result?.count ?? 0;
    });
  }
}
