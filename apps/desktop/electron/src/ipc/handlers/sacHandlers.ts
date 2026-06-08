import { ipcMain } from 'electron';

import { sacService } from '../../modules/directories/sac/SacService';

export function registerSacHandlers(): void {
  ipcMain.handle('directory:sac:get', async (_, code: string) => {
    return await sacService.getByCode(code);
  });

  ipcMain.handle('directory:sac:search', async (_, query: string, includeAll?: boolean) => {
    return await sacService.search(query, includeAll);
  });
}
