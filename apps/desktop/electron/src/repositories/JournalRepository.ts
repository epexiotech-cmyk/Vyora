import { randomUUID } from 'crypto';

import {
  vouchers,
  voucher_entries,
  InsertVoucher,
  InsertVoucherEntry,
  Voucher,
} from '@vyora/database';
import { eq } from 'drizzle-orm';

import { BaseRepository, TransactionExecutor } from './BaseRepository';

export class JournalRepository extends BaseRepository {
  /**
   * Creates a new voucher along with its ledger entries.
   * MUST be executed within a transaction.
   */
  public createVoucher(
    voucher: InsertVoucher,
    entries: InsertVoucherEntry[],
    tx: TransactionExecutor,
  ): Voucher {
    // 1. Insert the voucher header
    const createdVoucher = tx.insert(vouchers).values(voucher).returning().get();

    // 2. Map the voucherId to the entries
    const entriesToInsert = entries.map((entry) => ({
      ...entry,
      voucherId: createdVoucher.id,
    }));

    // 3. Insert the voucher entries
    tx.insert(voucher_entries).values(entriesToInsert).run();

    return createdVoucher;
  }

  /**
   * Generates a cancellation/reversal voucher that inverses the original entry.
   * Does NOT delete the original.
   */
  public cancelVoucher(
    originalVoucherId: string,
    reversalVoucher: InsertVoucher,
    tx: TransactionExecutor,
  ): Voucher {
    // 1. Fetch original entries
    const originalEntries = tx
      .select()
      .from(voucher_entries)
      .where(eq(voucher_entries.voucherId, originalVoucherId))
      .all();
    if (!originalEntries.length) {
      throw new Error(
        `Cannot cancel voucher: No entries found for voucher ID ${originalVoucherId}`,
      );
    }

    // 2. Insert the reversal voucher header
    reversalVoucher.reversalVoucherId = originalVoucherId; // link back
    const createdReversalVoucher = tx.insert(vouchers).values(reversalVoucher).returning().get();

    // 3. Insert inverse entries (swap debits and credits)
    const reversalEntries: InsertVoucherEntry[] = originalEntries.map((entry, index) => ({
      id: randomUUID(), // assume crypto.randomUUID is handled or passed if generated
      voucherId: createdReversalVoucher.id,
      lineNumber: index + 1,
      ledgerId: entry.ledgerId,
      debitAmount: entry.creditAmount, // Swapped
      creditAmount: entry.debitAmount, // Swapped
      entryDate: reversalVoucher.voucherDate as Date,
      narration: `Reversal of ${originalVoucherId}`,
      createdAt: new Date(),
    }));

    tx.insert(voucher_entries).values(reversalEntries).run();

    // 4. Mark original as cancelled
    tx.update(vouchers)
      .set({ isCancelled: true, updatedAt: new Date() })
      .where(eq(vouchers.id, originalVoucherId))
      .run();

    return createdReversalVoucher;
  }
}

export const journalRepository = new JournalRepository();
