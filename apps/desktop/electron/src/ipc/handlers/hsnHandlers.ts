import { ipcMain } from 'electron';

import { hsnService } from '../../modules/directories/hsn/HsnService';

export function registerHsnHandlers(): void {
  ipcMain.handle('directory:hsn:get', async (_, code: string) => {
    return await hsnService.getByCode(code);
  });

  ipcMain.handle('directory:hsn:search', async (_, query: string, limit?: number) => {
    return await hsnService.search(query, limit);
  });
}
