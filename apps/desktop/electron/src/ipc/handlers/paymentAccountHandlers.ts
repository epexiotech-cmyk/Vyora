import {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
  PaymentAccountFilterDto,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { paymentAccountService } from '../../services/PaymentAccountService';
import { mapErrorToContract } from '../wrapper';

export function registerPaymentAccountHandlers() {
  ipcMain.handle('paymentAccount:create', async (_, data: CreatePaymentAccountInput) => {
    try {
      return await paymentAccountService.create(data);
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle(
    'paymentAccount:update',
    async (_, id: string, data: UpdatePaymentAccountInput) => {
      try {
        return await paymentAccountService.update(id, data);
      } catch (error) {
        return mapErrorToContract(error);
      }
    },
  );

  ipcMain.handle('paymentAccount:delete', async (_, id: string) => {
    try {
      await paymentAccountService.delete(id);
      return { success: true };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle('paymentAccount:getById', async (_, id: string) => {
    try {
      return await paymentAccountService.getById(id);
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle('paymentAccount:search', async (_, filter: PaymentAccountFilterDto) => {
    try {
      return await paymentAccountService.search(filter);
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle(
    'paymentAccount:openingBalance:create',
    async (_, input: import('@vyora/types').CreateOpeningBalanceInput) => {
      try {
        const { paymentAccountOpeningBalanceService } =
          await import('../../services/PaymentAccountOpeningBalanceService');
        return {
          success: true,
          data: await paymentAccountOpeningBalanceService.createOpeningBalance(input),
        };
      } catch (error) {
        return mapErrorToContract(error);
      }
    },
  );

  ipcMain.handle(
    'paymentAccount:openingBalance:update',
    async (_, input: import('@vyora/types').CreateOpeningBalanceInput) => {
      try {
        const { paymentAccountOpeningBalanceService } =
          await import('../../services/PaymentAccountOpeningBalanceService');
        return {
          success: true,
          data: await paymentAccountOpeningBalanceService.updateOpeningBalance(input),
        };
      } catch (error) {
        return mapErrorToContract(error);
      }
    },
  );

  ipcMain.handle('paymentAccount:openingBalance:reverse', async (_, paymentAccountId: string) => {
    try {
      const { paymentAccountOpeningBalanceService } =
        await import('../../services/PaymentAccountOpeningBalanceService');
      return {
        success: true,
        data: await paymentAccountOpeningBalanceService.reverseOpeningBalance(paymentAccountId),
      };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle('paymentAccount:openingBalance:get', async (_, paymentAccountId: string) => {
    try {
      const { paymentAccountOpeningBalanceService } =
        await import('../../services/PaymentAccountOpeningBalanceService');
      return {
        success: true,
        data: await paymentAccountOpeningBalanceService.getOpeningBalance(paymentAccountId),
      };
    } catch (error) {
      return mapErrorToContract(error);
    }
  });

  ipcMain.handle(
    'paymentAccount:saveWithOpeningBalance',
    async (
      _,
      payload: {
        isEditing: boolean;
        accountId?: string;
        accountData:
          | import('@vyora/types').CreatePaymentAccountInput
          | import('@vyora/types').UpdatePaymentAccountInput;
        openingBalance?: {
          amount: number;
          type: 'Dr' | 'Cr';
          date: Date;
          notes?: string;
        };
      },
    ) => {
      try {
        const { paymentAccountOpeningBalanceService } =
          await import('../../services/PaymentAccountOpeningBalanceService');
        const { dbService } = await import('../../services/database/DatabaseService');

        return dbService.getDb().transaction((tx) => {
          let account;
          if (payload.isEditing && payload.accountId) {
            account = paymentAccountService.update(
              payload.accountId,
              payload.accountData as import('@vyora/types').UpdatePaymentAccountInput,
              tx,
            );
          } else {
            account = paymentAccountService.create(
              payload.accountData as import('@vyora/types').CreatePaymentAccountInput,
              undefined,
              tx,
            );
          }

          if (payload.openingBalance && payload.openingBalance.amount > 0) {
            const obInput = {
              paymentAccountId: account.id,
              amount: payload.openingBalance.amount,
              balanceType: payload.openingBalance.type,
              voucherDate: payload.openingBalance.date,
              notes: payload.openingBalance.notes,
            };
            if (payload.isEditing) {
              const existing = paymentAccountOpeningBalanceService.getOpeningBalance(account.id);
              if (existing) {
                paymentAccountOpeningBalanceService.updateOpeningBalance(obInput, tx);
              } else {
                paymentAccountOpeningBalanceService.createOpeningBalance(obInput, tx);
              }
            } else {
              paymentAccountOpeningBalanceService.createOpeningBalance(obInput, tx);
            }
          } else if (payload.isEditing) {
            const existing = paymentAccountOpeningBalanceService.getOpeningBalance(account.id);
            if (existing) {
              paymentAccountOpeningBalanceService.reverseOpeningBalance(account.id, tx);
            }
          }

          return { success: true, data: account };
        });
      } catch (error) {
        return mapErrorToContract(error);
      }
    },
  );
}
