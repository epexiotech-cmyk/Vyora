import { hsnMaster } from '@vyora/database';
import { eq, like, or, and } from 'drizzle-orm';

import { DirectoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

import type { HsnDto } from './HsnDto';

export class HsnRepository {
  constructor(private readonly dbService: DirectoryDatabaseService) {}

  public async getByCode(hsnCode: string): Promise<HsnDto | null> {
    const db = this.dbService.getDb();
    if (!db) {
      throw new Error('Directory database is not initialized');
    }

    const results = await db
      .select()
      .from(hsnMaster)
      .where(eq(hsnMaster.hsnCode, hsnCode))
      .limit(1);

    return results[0] || null;
  }

  public async search(
    query: string,
    limit: number = 50,
    includeAll: boolean = false,
  ): Promise<HsnDto[]> {
    const db = this.dbService.getDb();
    if (!db) {
      throw new Error('Directory database is not initialized');
    }

    let conditions = or(
      like(hsnMaster.hsnCode, `${query}%`),
      like(hsnMaster.description, `%${query}%`),
    );

    if (!includeAll) {
      conditions = and(conditions, eq(hsnMaster.isInvoiceSelectable, 1));
    }

    return db.select().from(hsnMaster).where(conditions).limit(limit);
  }
}
