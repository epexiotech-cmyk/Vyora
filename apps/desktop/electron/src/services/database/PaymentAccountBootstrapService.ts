import { randomUUID } from 'crypto';

import { payment_accounts, ledgers, ledger_groups, InsertPaymentAccount } from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import type { DbTransaction } from '../../repositories/BaseRepository';
import { ChartOfAccountsRepository } from '../../repositories/ChartOfAccountsRepository';

export class PaymentAccountBootstrapService {
  private coaRepo = new ChartOfAccountsRepository();

  public seedPaymentAccounts(companyId: string, tx: DbTransaction): void {
    // Note: Drizzle synchronous transaction behavior means we must use async/await
    // However, looking at CompanyBootstrapService, it uses sync wrappers or promises
    // Wait, CompanyBootstrapService returns a Promise in createCompany.
    // I will write this as an async method if tx is an async executor, but it's called inside `dbService.getDb().transaction((tx) => {...})` which might be synchronous if using better-sqlite3.
    // Drizzle with better-sqlite3 supports synchronous operations via `.run()`, `.all()`, `.get()`, `.values()`.

    // We need to fetch the Cash ledger that was just created.
    const cashLedger = tx
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Cash')))
      .get();

    if (cashLedger) {
      const now = new Date();
      tx.insert(payment_accounts)
        .values({
          id: randomUUID(),
          companyId,
          ledgerId: cashLedger.id,
          accountType: 'CASH',
          displayName: 'Cash Account',
          displayOrder: 1,
          isDefault: true,
          isSystem: true,
          isActive: true,
          qrEnabled: false,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        } as InsertPaymentAccount)
        .run();
    }

    // Create 'Primary UPI' ledger under 'Bank Accounts'
    const bankAccountsGroup = tx
      .select()
      .from(ledger_groups)
      .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Bank Accounts')))
      .get();

    if (bankAccountsGroup) {
      const upiLedgerId = randomUUID();
      const now = new Date();

      tx.insert(ledgers)
        .values({
          id: upiLedgerId,
          companyId,
          groupId: bankAccountsGroup.id,
          name: 'Primary UPI',
          referenceType: 'BANK',
          isSystemAccount: true, // Mark it as system
          allowManualPosting: true,
          isFrozen: false,
          openingBalance: 0,
          openingType: 'Dr',
          isActive: true,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(payment_accounts)
        .values({
          id: randomUUID(),
          companyId,
          ledgerId: upiLedgerId,
          accountType: 'UPI',
          displayName: 'Primary UPI',
          displayOrder: 2,
          isDefault: true,
          isSystem: true, // Mark it as system
          isActive: true,
          qrEnabled: false,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        } as InsertPaymentAccount)
        .run();
    }
  }
}

export const paymentAccountBootstrapService = new PaymentAccountBootstrapService();
