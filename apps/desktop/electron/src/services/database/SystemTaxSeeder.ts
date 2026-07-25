import { randomUUID } from 'crypto';

import { taxes, companies } from '@vyora/database';
import { GST_RATES } from '@vyora/types';
import { eq } from 'drizzle-orm';

import { DbTransaction } from '../../repositories/BaseRepository';

import { dbService } from './DatabaseService';

export class SystemTaxSeeder {
  /**
   * Seeds standard GST tax brackets idempotently for a specific company.
   * Uses rate + taxType to determine uniqueness to prevent duplication even if renamed.
   */
  public seedSystemTaxes(companyId: string, tx?: DbTransaction) {
    const executor = tx || dbService.getDb();

    // 1. Fetch existing taxes for this company
    const existingTaxes = executor.select().from(taxes).where(eq(taxes.companyId, companyId)).all();

    // 2. Create a Set of existing identifiers (taxType-rate)
    const existingIdentifiers = new Set(
      existingTaxes.map((t: typeof taxes.$inferSelect) => `${t.taxType}-${t.rate}`),
    );

    const now = new Date();

    // 3. Filter the standard taxes to find only those that are missing
    const missingTaxes = GST_RATES.filter(
      (st) => !existingIdentifiers.has(`${st.taxType}-${st.totalRate}`),
    ).map((st) => ({
      id: randomUUID(),
      companyId,
      name: st.name,
      rate: st.totalRate,
      taxType: st.taxType,
      isActive: true,
      createdAt: now,
    }));

    // 4. Insert only missing taxes
    if (missingTaxes.length > 0) {
      executor.insert(taxes).values(missingTaxes).run();
    }
  }

  /**
   * One-time idempotent backfill for all existing companies.
   */
  public backfillAllCompanies() {
    return dbService.getDb().transaction((tx) => {
      const allCompanies = tx.select({ id: companies.id }).from(companies).all();

      for (const company of allCompanies) {
        this.seedSystemTaxes(company.id, tx);
      }
    });
  }
}

export const systemTaxSeeder = new SystemTaxSeeder();
