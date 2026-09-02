import { CreateVoucherInput } from '@vyora/types';

import { DbTransaction } from '../../repositories/BaseRepository';
import { dbService } from '../../services/database/DatabaseService';
import { journalService } from '../../services/JournalService';
import { createIpcHandler } from '../wrapper';

export function registerJournalHandlers() {
  createIpcHandler<{ voucherId: string; voucherNumber: string }>(
    'journal:postVoucher',
    async (_event, input: CreateVoucherInput) => {
      const db = dbService.getDb();
      return db.transaction(async (tx: DbTransaction) => {
        const result = await journalService.createVoucher(input, tx);
        return { success: true, data: result };
      });
    },
  );

  createIpcHandler<{ voucherId: string }>(
    'journal:postTransfer',
    async (
      _event,
      input: {
        fromPaymentAccountId: string;
        toPaymentAccountId: string;
        amount: number;
        transferDate: Date;
        narration?: string;
      },
    ) => {
      const db = dbService.getDb();
      return db.transaction((tx: DbTransaction) => {
        const result = journalService.postTransfer(input, tx);
        return { success: true, data: result };
      });
    },
  );

  createIpcHandler<{ cancelledVoucherId: string }>(
    'journal:cancelTransfer',
    async (_event, id: string) => {
      const db = dbService.getDb();
      return db.transaction((tx: DbTransaction) => {
        const result = journalService.cancelTransferSync(id, tx);
        return { success: true, data: result };
      });
    },
  );

  createIpcHandler<{ voucherId: string }>(
    'journal:updateTransfer',
    async (
      _event,
      input: {
        voucherId: string;
        fromPaymentAccountId: string;
        toPaymentAccountId: string;
        amount: number;
        transferDate: Date;
        narration?: string;
      },
    ) => {
      const db = dbService.getDb();
      return db.transaction((tx: DbTransaction) => {
        // 1. Cancel existing transfer (restores balances)
        journalService.cancelTransferSync(input.voucherId, tx);

        // 2. Post new transfer (validates against restored balances)
        const result = journalService.postTransfer(input, tx);
        return { success: true, data: result };
      });
    },
  );

  createIpcHandler<{ cancelledVoucherId: string }>(
    'journal:cancelVoucher',
    async (_event, id: string) => {
      const result = await journalService.cancelVoucher(id);
      return { success: true, data: result };
    },
  );

  createIpcHandler<{ reversalVoucherId: string }>(
    'journal:reverseVoucher',
    async (_event, id: string) => {
      const result = await journalService.reverseVoucher(id);
      return { success: true, data: result };
    },
  );
}
