import { uqcMaster, VyoraDatabase } from '@vyora/database';
import { eq, like, count, or, and } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export class UqcRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryDatabaseService.getDb();
  }

  async findByCode(code: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(uqcMaster)
        .where(and(eq(uqcMaster.isActive, true), eq(uqcMaster.gstUqcCode, code)))
        .get();
    });
  }

  async search(query: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(uqcMaster)
        .where(
          and(
            eq(uqcMaster.isActive, true),
            or(like(uqcMaster.displayName, `%${query}%`), like(uqcMaster.gstUqcCode, `${query}%`)),
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
        .from(uqcMaster)
        .where(eq(uqcMaster.isActive, true))
        .get();
      return result?.count ?? 0;
    });
  }
}
