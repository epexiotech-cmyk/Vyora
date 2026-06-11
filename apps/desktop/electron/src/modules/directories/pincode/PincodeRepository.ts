import { pincodeMaster, VyoraDatabase } from '@vyora/database';
import { eq, like, count, or } from 'drizzle-orm';

import { BaseRepository } from '../../../repositories/BaseRepository';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export type InsertPincode = typeof pincodeMaster.$inferInsert;

export class PincodeRepository extends BaseRepository {
  protected override get db(): VyoraDatabase {
    return directoryDatabaseService.getDb();
  }

  async findByPincode(pincode: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db.select().from(pincodeMaster).where(eq(pincodeMaster.pincode, pincode)).all();
    });
  }

  async searchByPincode(prefix: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(pincodeMaster)
        .where(like(pincodeMaster.pincode, `${prefix}%`))
        .limit(50)
        .all();
    });
  }

  async searchByDistrict(district: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(pincodeMaster)
        .where(like(pincodeMaster.district, `%${district}%`))
        .limit(50)
        .all();
    });
  }

  async searchByState(state: string) {
    return directoryDatabaseService.execute(async (db) => {
      return db
        .select()
        .from(pincodeMaster)
        .where(like(pincodeMaster.stateName, `%${state}%`))
        .limit(50)
        .all();
    });
  }

  async search(query: { pincode?: string; district?: string; state?: string }) {
    return directoryDatabaseService.execute(async (db) => {
      const conditions = [];
      if (query.pincode) conditions.push(like(pincodeMaster.pincode, `${query.pincode}%`));
      if (query.district) conditions.push(like(pincodeMaster.district, `%${query.district}%`));
      if (query.state) conditions.push(like(pincodeMaster.stateName, `%${query.state}%`));

      const dbQuery = db.select().from(pincodeMaster);
      if (conditions.length > 0) {
        return dbQuery
          .where(or(...conditions))
          .limit(50)
          .all();
      }
      return dbQuery.limit(50).all();
    });
  }

  async count() {
    return directoryDatabaseService.execute(async (db) => {
      const result = await db.select({ count: count() }).from(pincodeMaster).get();
      return result?.count ?? 0;
    });
  }
}
