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
      return db.transaction((tx: DbTransaction) => {
        const result = journalService.createVoucherSync(input, tx);
        return { success: true, data: result };
      });
    },
  );
}
