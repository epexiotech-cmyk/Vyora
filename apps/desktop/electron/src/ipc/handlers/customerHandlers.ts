import { Customer, InsertCustomer, ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { customerService } from '../../services/CustomerService';

export function registerCustomerHandlers() {
  ipcMain.handle(
    'db:customers:getAll',
    async (_event, _args?: unknown): Promise<ApiResponse<Customer[]>> => {
      try {
        const result = await customerService.getAllCustomers();
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:create',
    async (
      _event,
      data: Omit<InsertCustomer, 'id' | 'createdAt'>,
    ): Promise<ApiResponse<Customer>> => {
      try {
        const result = await customerService.createCustomer(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
