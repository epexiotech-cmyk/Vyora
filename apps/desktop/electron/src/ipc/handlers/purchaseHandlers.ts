import { ApiResponse, CreatePurchaseInvoiceInput } from '@vyora/types';
import { ipcMain } from 'electron';

import { purchaseInvoiceService } from '../../services/PurchaseInvoiceService';

export function registerPurchaseHandlers() {
  ipcMain.handle(
    'purchase:invoice:create',
    async (
      _event,
      data: CreatePurchaseInvoiceInput,
    ): Promise<ApiResponse<{ invoiceId: string }>> => {
      try {
        const result = await purchaseInvoiceService.createInvoice(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
