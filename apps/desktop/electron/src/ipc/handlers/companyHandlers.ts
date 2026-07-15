import { CompanyProfileDto, UpdateCompanyProfileRequest, ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { companyContextService } from '../../services/CompanyContextService';

export function registerCompanyHandlers() {
  ipcMain.handle('company:get-active', async (): Promise<ApiResponse<string | null>> => {
    try {
      await companyContextService.loadActiveCompany();
      const activeCompanyId = companyContextService.getActiveCompany();
      return { success: true, data: activeCompanyId };
    } catch (error) {
      console.error('Error fetching active company:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'company:get-context',
    async (): Promise<ApiResponse<import('@vyora/types').CompanyContextDto | null>> => {
      try {
        const context = await companyContextService.getContext();
        return { success: true, data: context };
      } catch (error) {
        console.error('Error getting company context:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('company:set-active', async (_, companyId: string): Promise<ApiResponse<void>> => {
    try {
      await companyContextService.setActiveCompany(companyId);
      return { success: true };
    } catch (error) {
      console.error('Error setting active company:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'company:get-profile',
    async (_, id: string): Promise<ApiResponse<CompanyProfileDto | null>> => {
      try {
        const profile = await companyContextService.getProfile(id);
        return { success: true, data: profile };
      } catch (error) {
        console.error('Error getting company profile:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:update-profile',
    async (
      _,
      id: string,
      payload: UpdateCompanyProfileRequest,
    ): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const profile = await companyContextService.updateProfile(id, payload);
        return { success: true, data: profile };
      } catch (error) {
        console.error('Error updating company profile:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
