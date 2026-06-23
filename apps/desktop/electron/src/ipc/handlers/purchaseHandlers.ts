import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  SearchPurchasesOptions,
  PurchaseDto,
  PurchaseListDto,
  ApiResponse,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { purchaseService } from '../../services/PurchaseService';

export function registerPurchaseHandlers() {
  ipcMain.handle(
    'db:purchases:create',
    async (_, payload: CreatePurchaseInput): Promise<ApiResponse<string>> => {
      try {
        const id = await purchaseService.create(payload);
        return { success: true, data: id };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:purchases:update',
    async (_, payload: UpdatePurchaseInput): Promise<ApiResponse<void>> => {
      try {
        await purchaseService.updateDraft(payload);
        return { success: true, data: undefined };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:purchases:submit', async (_, id: string): Promise<ApiResponse<void>> => {
    try {
      await purchaseService.submitPurchase(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(
    'db:purchases:getById',
    async (_, id: string): Promise<ApiResponse<PurchaseDto | null>> => {
      try {
        const data = await purchaseService.getById(id);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:purchases:search',
    async (_, options: SearchPurchasesOptions): Promise<ApiResponse<PurchaseListDto>> => {
      try {
        const data = await purchaseService.search(options);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:purchases:cancel', async (_, id: string): Promise<ApiResponse<void>> => {
    try {
      await purchaseService.cancelPurchase(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('db:purchases:delete', async (_, id: string): Promise<ApiResponse<void>> => {
    try {
      await purchaseService.delete(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
