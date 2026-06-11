import {
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
  ApiResponse,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { supplierService } from '../../services/SupplierService';

export function registerSupplierHandlers() {
  ipcMain.handle(
    'db:suppliers:search',
    async (_event, options: SearchSuppliersOptions): Promise<ApiResponse<SupplierListDto>> => {
      try {
        const result = await supplierService.searchSuppliers(options);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:suppliers:getById',
    async (_event, id: string): Promise<ApiResponse<SupplierProfileDto | null>> => {
      try {
        const result = await supplierService.getSupplierById(id);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:suppliers:create',
    async (_event, data: CreateSupplierInput): Promise<ApiResponse<SupplierProfileDto>> => {
      try {
        const result = await supplierService.createSupplier(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:suppliers:update',
    async (
      _event,
      id: string,
      data: UpdateSupplierInput,
    ): Promise<ApiResponse<SupplierProfileDto>> => {
      try {
        const result = await supplierService.updateSupplier(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:suppliers:deactivate',
    async (_event, id: string): Promise<ApiResponse<void>> => {
      try {
        await supplierService.deactivateSupplier(id);
        return { success: true, data: undefined };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
