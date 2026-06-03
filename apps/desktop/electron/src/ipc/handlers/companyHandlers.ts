import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';

export function registerCompanyHandlers() {
  ipcMain.handle('company:get-active', async () => {
    try {
      const activeId = await companyContextService.loadActiveCompany();
      return { success: true, data: activeId };
    } catch (error) {
      console.error('Error fetching active company:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('company:set-active', async (_, companyId: string) => {
    try {
      await companyContextService.setActiveCompany(companyId);
      return { success: true };
    } catch (error) {
      console.error('Error setting active company:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
