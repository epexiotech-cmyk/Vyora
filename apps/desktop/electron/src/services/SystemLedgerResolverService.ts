import { ledgers, Ledger } from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { TransactionExecutor } from '../repositories/BaseRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';

export class SystemLedgerResolverService {
  /**
   * Retrieves a system ledger by its exact name.
   */
  public getSystemLedgerByName(name: string, tx?: TransactionExecutor): Ledger {
    const activeTx = tx || dbService.getDb();
    const companyId = companyContextService.getActiveCompany() as string;

    const ledger = activeTx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, companyId),
          eq(ledgers.name, name),
          eq(ledgers.isSystemAccount, true),
        ),
      )
      .get();

    if (!ledger) {
      throw new Error(
        `Critical failure: System ledger '${name}' not found. Database bootstrap might be incomplete.`,
      );
    }

    return ledger;
  }
}

export const systemLedgerResolver = new SystemLedgerResolverService();
