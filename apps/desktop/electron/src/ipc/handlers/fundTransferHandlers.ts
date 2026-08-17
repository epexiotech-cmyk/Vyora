import type {
  CreateFundTransferInput,
  UpdateFundTransferInput,
  FundTransferQueryFilter,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { fundTransferService } from '../../services/FundTransferService';
import { mapErrorToContract } from '../wrapper';

export function registerFundTransferHandlers() {
  ipcMain.handle('fundTransfer:create', async (_, input: CreateFundTransferInput) => {
    try {
      const result = await fundTransferService.createTransfer(input);
      return { success: true, data: result };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle(
    'fundTransfer:update',
    async (_, payload: { id: string; input: UpdateFundTransferInput }) => {
      try {
        const result = await fundTransferService.updateTransfer(payload.id, payload.input);
        return { success: true, data: result };
      } catch (error) {
        return mapErrorToContract(error);
      }
    },
  );

  ipcMain.handle('fundTransfer:reverse', async (_, id: string) => {
    try {
      const result = await fundTransferService.reverseTransfer(id);
      return { success: true, data: result };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle('fundTransfer:getAll', async (_, filter: FundTransferQueryFilter) => {
    try {
      const result = await fundTransferService.getTransfers(filter);
      return { success: true, data: result };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });
}
