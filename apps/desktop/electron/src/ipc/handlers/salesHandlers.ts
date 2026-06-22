import {
  ApiResponse,
  CreateSalesInvoiceInput,
  SalesInvoiceDto,
  ListSalesInvoicesOptions,
  UpdateSalesInvoiceInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { salesInvoiceService, StockValidationError } from '../../services/SalesInvoiceService';

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

  ipcMain.handle(
    'sales:invoice:updateDraft',
    async (
      _event,
      invoiceId: string,
      payload: UpdateSalesInvoiceInput,
    ): Promise<ApiResponse<SalesInvoiceDto>> => {
      try {
        const result = await salesInvoiceService.updateDraft(invoiceId, payload);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'sales:invoice:submit',
    async (_event, invoiceId: string): Promise<ApiResponse<{ warnings: unknown[] }>> => {
      try {
        const result = await salesInvoiceService.submitInvoice(invoiceId);
        return { success: true, data: { warnings: result.warnings } };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'StockValidationError') {
          return {
            success: false,
            error: err.message,
            validations: (err as StockValidationError).validations,
          };
        }
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'sales:invoice:cancel',
    async (_event, invoiceId: string): Promise<ApiResponse<void>> => {
      try {
        await salesInvoiceService.cancelInvoice(invoiceId);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'sales:invoice:getById',
    async (_event, invoiceId: string): Promise<ApiResponse<SalesInvoiceDto>> => {
      try {
        const result = await salesInvoiceService.getInvoiceById(invoiceId);
        return { success: true, data: result as unknown as SalesInvoiceDto };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'sales:invoice:list',
    async (_event, options?: ListSalesInvoicesOptions): Promise<ApiResponse<SalesInvoiceDto[]>> => {
      try {
        const result = await salesInvoiceService.listInvoices(options);
        return { success: true, data: result as unknown as SalesInvoiceDto[] };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
