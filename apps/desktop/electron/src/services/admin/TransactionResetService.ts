import { DbTransaction } from '../../main/database/adapters/IDatabaseAdapter';
import { dbService } from '../database/DatabaseService';

import {
  AccountingResetProvider,
  DocumentNumberingResetProvider,
  InventoryResetProvider,
  PurchasesResetProvider,
  SalesResetProvider,
  SettlementResetProvider,
} from './reset';

export class TransactionResetService {
  private settlementProvider = new SettlementResetProvider();
  private accountingProvider = new AccountingResetProvider();
  private salesProvider = new SalesResetProvider();
  private purchasesProvider = new PurchasesResetProvider();
  private inventoryProvider = new InventoryResetProvider();
  private docNumberingProvider = new DocumentNumberingResetProvider();

  /**
   * Safely hard-resets all transactional data in the correct topological order.
   * Modifies the database. Ensure this is only called from developer/admin utilities.
   */
  public async hardResetAllSync(): Promise<void> {
    const db = dbService.getDb();

    return db.transaction((tx: DbTransaction) => {
      // Must be executed in an order that respects foreign keys (child tables first)

      // 1. Settlements and Allocations (depend on invoices/vouchers)
      this.settlementProvider.reset(tx);

      // 2. Accounting Vouchers (depend on base transactions or are standalone)
      this.accountingProvider.reset(tx);

      // 3. Sales
      this.salesProvider.reset(tx);

      // 4. Purchases
      this.purchasesProvider.reset(tx);

      // 5. Inventory (depends on sales/purchases, but we're wiping it all anyway)
      this.inventoryProvider.reset(tx);

      // 6. Reset Sequences
      this.docNumberingProvider.reset(tx);
    });
  }
}

export const transactionResetService = new TransactionResetService();
