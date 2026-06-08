import { stateMaster, VyoraDatabase } from '@vyora/database';
import { eq, like, count, or, and } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export class StateRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryDatabaseService.getDb();
  }

  async findByCode(code: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(stateMaster)
        .where(and(eq(stateMaster.isActive, true), eq(stateMaster.stateCode, code)))
        .get();
    });
  }

  async search(query: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(stateMaster)
        .where(
          and(
            eq(stateMaster.isActive, true),
            or(like(stateMaster.stateName, `%${query}%`), like(stateMaster.stateCode, `${query}%`)),
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
        .from(stateMaster)
        .where(eq(stateMaster.isActive, true))
        .get();
      return result?.count ?? 0;
    });
  }
}
