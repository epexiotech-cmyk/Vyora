import { ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { CreateSalesInvoiceInput } from '../../repositories';
import { salesInvoiceService } from '../../services/SalesInvoiceService';

export function registerSalesInvoiceHandlers() {
  ipcMain.handle(
    'sales:invoice:create',
    async (_event, data: CreateSalesInvoiceInput): Promise<ApiResponse<{ invoiceId: string }>> => {
      try {
        const result = await salesInvoiceService.createInvoice(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
