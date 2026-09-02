import {
  CompanyProfileDto,
  UpdateCompanyProfileRequest,
  ApiResponse,
  CreateCompanyInput,
  CompanyDto,
} from '@vyora/types';
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
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('company:list', async (): Promise<ApiResponse<CompanyDto[]>> => {
    try {
      const companies = await companyContextService.listCompanies();
      return { success: true, data: companies };
    } catch (error) {
      console.error('Error listing companies:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'company:create',
    async (_, payload: CreateCompanyInput): Promise<ApiResponse<string>> => {
      try {
        const companyId = await companyContextService.createCompany(payload);
        return { success: true, data: companyId };
      } catch (error) {
        console.error('Error creating company:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('company:delete', async (_, companyId: string): Promise<ApiResponse<void>> => {
    try {
      await companyContextService.deleteCompany(companyId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'company:upload-logo',
    async (
      _,
      companyId: string,
      filename: string,
      buffer: Buffer | ArrayBuffer,
    ): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.uploadLogo(companyId, filename, buffer);
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error uploading company logo:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:delete-logo',
    async (_, companyId: string): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.deleteLogo(companyId);
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error deleting company logo:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:upload-signature',
    async (
      _,
      companyId: string,
      filename: string,
      buffer: Buffer | ArrayBuffer,
    ): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.uploadSignature(
          companyId,
          filename,
          buffer,
        );
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error uploading company signature:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:update-signature-designation',
    async (
      _,
      companyId: string,
      signatureId: string,
      designation: string,
    ): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.updateSignatureDesignation(
          companyId,
          signatureId,
          designation,
        );
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error updating signature designation:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:set-signature-default',
    async (_, companyId: string, signatureId: string): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.setSignatureAsDefault(
          companyId,
          signatureId,
        );
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error setting company signature as default:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'company:delete-signature-by-id',
    async (_, companyId: string, signatureId: string): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.deleteSignatureById(
          companyId,
          signatureId,
        );
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error deleting company signature:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // Keep legacy handler just in case
  ipcMain.handle(
    'company:delete-signature',
    async (_, companyId: string): Promise<ApiResponse<CompanyProfileDto>> => {
      try {
        const updatedProfile = await companyContextService.deleteSignature(companyId);
        return { success: true, data: updatedProfile };
      } catch (error) {
        console.error('Error deleting company signature:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
