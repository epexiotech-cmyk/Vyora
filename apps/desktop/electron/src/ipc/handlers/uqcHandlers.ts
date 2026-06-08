import { ipcMain } from 'electron';

import { uqcService } from '../../modules/directories/uqc/UqcService';

export function registerUqcHandlers() {
  ipcMain.handle('directory:uqc:get', async (_, code: string) => {
    return uqcService.getByCode(code);
  });

  ipcMain.handle('directory:uqc:search', async (_, query: string) => {
    return uqcService.search(query);
  });
}
