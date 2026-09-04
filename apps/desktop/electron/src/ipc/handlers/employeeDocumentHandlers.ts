import { CreateEmployeeDocumentInputSchema, UpdateEmployeeDocumentInputSchema } from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeDocumentService } from '../../services/EmployeeDocumentService';

export function registerEmployeeDocumentHandlers() {
  ipcMain.handle('employeeDocument:getByEmployeeId', async (_, employeeId: string) => {
    try {
      const result = await employeeDocumentService.getByEmployeeId(employeeId);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeDocument:getById', async (_, id: string) => {
    try {
      const result = await employeeDocumentService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeDocument:create', async (_, employeeId: string, data) => {
    try {
      const parsedData = CreateEmployeeDocumentInputSchema.parse(data);
      const result = await employeeDocumentService.create(employeeId, parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'employeeDocument:upload',
    async (
      _,
      employeeId: string,
      data: Omit<import('@vyora/types').CreateEmployeeDocumentInput, 'filePath'>,
      filename: string,
      buffer: Buffer | ArrayBuffer,
    ) => {
      try {
        const result = await employeeDocumentService.uploadDocument(
          employeeId,
          data,
          filename,
          buffer,
        );
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('employeeDocument:update', async (_, id: string, data) => {
    try {
      const parsedData = UpdateEmployeeDocumentInputSchema.parse(data);
      const result = await employeeDocumentService.update(id, parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('employeeDocument:deactivate', async (_, id: string) => {
    try {
      await employeeDocumentService.deactivate(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
