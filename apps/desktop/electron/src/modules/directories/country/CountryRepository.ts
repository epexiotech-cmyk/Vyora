import { countryMaster, VyoraDatabase } from '@vyora/database';
import { eq, like, count, or, and } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export class CountryRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryDatabaseService.getDb();
  }

  async findByCode(code: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(countryMaster)
        .where(
          and(
            eq(countryMaster.isActive, true),
            or(eq(countryMaster.countryCode, code), eq(countryMaster.countryCodeAlpha3, code)),
          ),
        )
        .get();
    });
  }

  async search(query: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(countryMaster)
        .where(
          and(
            eq(countryMaster.isActive, true),
            or(
              like(countryMaster.countryName, `%${query}%`),
              like(countryMaster.countryCode, `${query}%`),
              like(countryMaster.countryCodeAlpha3, `${query}%`),
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
        .from(countryMaster)
        .where(eq(countryMaster.isActive, true))
        .get();
      return result?.count ?? 0;
    });
  }
}
