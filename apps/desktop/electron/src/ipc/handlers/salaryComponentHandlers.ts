import {
  CreateSalaryComponentInput,
  SearchSalaryComponentsOptions,
  UpdateSalaryComponentInput,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { salaryComponentService } from '../../services/SalaryComponentService';

export function registerSalaryComponentHandlers(): void {
  ipcMain.handle('salary-components:search', async (_, options: SearchSalaryComponentsOptions) => {
    try {
      const data = await salaryComponentService.search(options);
      return { success: true, data };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('salary-components:getById', async (_, id: string) => {
    try {
      const data = await salaryComponentService.getById(id);
      return { success: true, data };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('salary-components:create', async (_, data: CreateSalaryComponentInput) => {
    try {
      const result = await salaryComponentService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'salary-components:update',
    async (_, id: string, data: UpdateSalaryComponentInput) => {
      try {
        const result = await salaryComponentService.update(id, data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('salary-components:deactivate', async (_, id: string) => {
    try {
      await salaryComponentService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
