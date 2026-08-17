import { payment_accounts, ledgers } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { dbService } from './src/services/database/DatabaseService';

async function run() {
  try {
    await dbService.init();
    console.log('DB initialized');
    const db = dbService.getDb();

    const accounts = db.select().from(payment_accounts).all();
    console.log(
      'Payment Accounts:',
      accounts.map((a) => ({
        id: a.id,
        name: a.displayName,
        isActive: a.isActive,
        deletedAt: a.deletedAt,
        ledgerId: a.ledgerId,
      })),
    );

    if (accounts.length > 0) {
      const ledgerIds = accounts.map((a) => a.ledgerId);
      const accLedgers = db
        .select()
        .from(ledgers)
        .where(
          sql`${ledgers.id} IN (${sql.join(
            ledgerIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .all();
      console.log(
        'Linked Ledgers:',
        accLedgers.map((l) => ({
          id: l.id,
          name: l.name,
          isActive: l.isActive,
          deletedAt: l.deletedAt,
        })),
      );
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
