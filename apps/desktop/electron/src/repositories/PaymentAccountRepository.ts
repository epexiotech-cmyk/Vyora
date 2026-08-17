import { payment_accounts, PaymentAccount } from '@vyora/database';
import { and, eq, desc } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

export class PaymentAccountRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async getByCompanyAndType(companyId: string, accountType: string, tx?: DbTransaction) {
    const db = tx || this.db;
    return db
      .select()
      .from(payment_accounts)
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.accountType, accountType as PaymentAccount['accountType']),
        ),
      )
      .orderBy(desc(payment_accounts.isDefault), desc(payment_accounts.createdAt));
  }

  public async getById(id: string, tx?: DbTransaction) {
    const db = tx || this.db;
    const results = await db.select().from(payment_accounts).where(eq(payment_accounts.id, id));
    return results[0] || null;
  }

  public async getByLedgerId(ledgerId: string, tx?: DbTransaction) {
    const db = tx || this.db;
    const results = await db
      .select()
      .from(payment_accounts)
      .where(eq(payment_accounts.ledgerId, ledgerId));
    return results[0] || null;
  }

  public async getByCompany(companyId: string, tx?: DbTransaction) {
    const db = tx || this.db;
    return db
      .select()
      .from(payment_accounts)
      .where(eq(payment_accounts.companyId, companyId))
      .orderBy(desc(payment_accounts.createdAt));
  }

  public async getDefaultBank(companyId: string, tx?: DbTransaction) {
    const db = tx || this.db;
    const results = await db
      .select()
      .from(payment_accounts)
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.isDefault, true),
          eq(payment_accounts.accountType, 'BANK'),
          eq(payment_accounts.isActive, true),
        ),
      )
      .orderBy(desc(payment_accounts.createdAt));
    return results[0] || null;
  }

  public async getDefaultQrAccount(companyId: string, tx?: DbTransaction) {
    const db = tx || this.db;
    const results = await db
      .select()
      .from(payment_accounts)
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.isDefault, true),
          eq(payment_accounts.qrEnabled, true),
          eq(payment_accounts.isActive, true),
        ),
      )
      .orderBy(desc(payment_accounts.createdAt));
    return results[0] || null;
  }

  public getByIdSync(id: string, tx: DbTransaction) {
    const results = tx.select().from(payment_accounts).where(eq(payment_accounts.id, id)).all();
    return results[0] || null;
  }

  public getDefaultBankSync(companyId: string, tx: DbTransaction) {
    const results = tx
      .select()
      .from(payment_accounts)
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.isDefault, true),
          eq(payment_accounts.accountType, 'BANK'),
          eq(payment_accounts.isActive, true),
        ),
      )
      .orderBy(desc(payment_accounts.createdAt))
      .all();
    return results[0] || null;
  }

  public getDefaultQrAccountSync(companyId: string, tx: DbTransaction) {
    const results = tx
      .select()
      .from(payment_accounts)
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.isDefault, true),
          eq(payment_accounts.qrEnabled, true),
          eq(payment_accounts.isActive, true),
        ),
      )
      .orderBy(desc(payment_accounts.createdAt))
      .all();
    return results[0] || null;
  }
}
export const paymentAccountRepository = new PaymentAccountRepository();
