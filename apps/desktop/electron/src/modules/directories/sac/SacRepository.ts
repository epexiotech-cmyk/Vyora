import { sacMaster } from '@vyora/database';
import { eq, like, or, and } from 'drizzle-orm';

import { DirectoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

import { SacDto } from './SacDto';

export class SacRepository {
  constructor(private readonly dbService: DirectoryDatabaseService) {}

  public async getByCode(sacCode: string): Promise<SacDto | null> {
    const db = this.dbService.getDb();
    if (!db) {
      throw new Error('Directory database is not initialized');
    }

    const results = await db
      .select()
      .from(sacMaster)
      .where(eq(sacMaster.sacCode, sacCode))
      .limit(1);

    return results[0] || null;
  }

  public async search(
    query: string,
    limit: number = 50,
    includeAll: boolean = false,
  ): Promise<SacDto[]> {
    const db = this.dbService.getDb();
    if (!db) {
      throw new Error('Directory database is not initialized');
    }

    let conditions = or(
      like(sacMaster.sacCode, `${query}%`),
      like(sacMaster.description, `%${query}%`),
    );

    if (!includeAll) {
      conditions = and(conditions, eq(sacMaster.isInvoiceSelectable, 1));
    }

    return db.select().from(sacMaster).where(conditions).limit(limit);
  }
}
