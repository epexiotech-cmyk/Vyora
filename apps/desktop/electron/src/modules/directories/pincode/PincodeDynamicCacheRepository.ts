import { pincodeDynamicCache, VyoraDatabase } from '@vyora/database';
import { eq, sql } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryManagerDatabaseService } from '../../../services/database/DirectoryManagerDatabaseService';

export class PincodeDynamicCacheRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryManagerDatabaseService.getDb();
  }

  async findByPincode(pincode: string) {
    return this.db
      .select()
      .from(pincodeDynamicCache)
      .where(eq(pincodeDynamicCache.pincode, pincode))
      .all();
  }

  async saveMany(pincodes: Omit<typeof pincodeDynamicCache.$inferInsert, 'id'>[]) {
    if (!pincodes || pincodes.length === 0) return [];

    // Drizzle handles bulk inserts natively
    return this.db.insert(pincodeDynamicCache).values(pincodes).returning().all();
  }

  async incrementLookupStats(pincode: string) {
    return this.db
      .update(pincodeDynamicCache)
      .set({
        lookupCount: sql`lookup_count + 1`,
        lastUsedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(pincodeDynamicCache.pincode, pincode))
      .run();
  }
}
