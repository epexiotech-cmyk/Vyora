import { ipcMain } from 'electron';

import { companyBootstrapService } from '../../services/CompanyBootstrapService';

export function registerBootstrapHandlers() {
  ipcMain.handle('bootstrap:status', async () => {
    try {
      const isCompleted = await companyBootstrapService.isSetupCompleted();
      return { success: true, data: isCompleted };
    } catch (error) {
      console.error('Error fetching bootstrap status:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'bootstrap:create-company',
    async (
      _,
      payload: {
        name: string;
        isGstRegistered: boolean;
        gstin: string | null;
        financialYearStart: Date;
        currency: string;
      },
    ) => {
      try {
        const companyId = await companyBootstrapService.createCompany(
          payload.name,
          payload.isGstRegistered,
          payload.gstin,
          new Date(payload.financialYearStart),
          payload.currency,
        );
        return { success: true, data: companyId };
      } catch (error) {
        console.error('Error creating company during bootstrap:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
