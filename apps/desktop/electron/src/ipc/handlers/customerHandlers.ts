import {
  CustomerProfileDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  SearchCustomersOptions,
  CustomerListDto,
  ApiResponse,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { customerService } from '../../services/CustomerService';

export function registerCustomerHandlers() {
  ipcMain.handle(
    'db:customers:search',
    async (_event, options: SearchCustomersOptions): Promise<ApiResponse<CustomerListDto>> => {
      try {
        const result = await customerService.searchCustomers(options);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:getById',
    async (_event, id: string): Promise<ApiResponse<CustomerProfileDto | null>> => {
      try {
        const result = await customerService.getCustomerById(id);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:create',
    async (_event, data: CreateCustomerInput): Promise<ApiResponse<CustomerProfileDto>> => {
      try {
        const result = await customerService.createCustomer(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:update',
    async (
      _event,
      id: string,
      data: UpdateCustomerInput,
    ): Promise<ApiResponse<CustomerProfileDto>> => {
      try {
        const result = await customerService.updateCustomer(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:deactivate',
    async (_event, id: string): Promise<ApiResponse<void>> => {
      try {
        await customerService.deactivateCustomer(id);
        return { success: true, data: undefined };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
