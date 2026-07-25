import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';
import { documentNumberingService } from '../../services/DocumentNumberingService';

export function registerDocumentNumberingHandlers() {
  ipcMain.handle('settings:document-numbering:get', async (_, documentType: string) => {
    try {
      const companyId = companyContextService.getActiveCompany();
      if (!companyId) throw new Error('No active company');
      const config = await documentNumberingService.getConfig(companyId, documentType);
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'settings:document-numbering:save',
    async (_, configData: import('@vyora/types').DocumentNumberingConfigDto) => {
      try {
        const companyId = companyContextService.getActiveCompany();
        if (!companyId) throw new Error('No active company');
        const config = await documentNumberingService.saveFullConfig(companyId, configData);
        return { success: true, data: config };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
  );
  ipcMain.handle('settings:document-numbering:getAll', async () => {
    try {
      const companyId = companyContextService.getActiveCompany();
      if (!companyId) throw new Error('No active company');
      const configs = await documentNumberingService.getAllConfigs(companyId);
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
