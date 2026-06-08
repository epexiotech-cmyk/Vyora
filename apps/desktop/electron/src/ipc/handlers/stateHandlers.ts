import { ipcMain } from 'electron';

import { stateService } from '../../modules/directories/state/StateService';

export function registerStateHandlers() {
  ipcMain.handle('directory:state:get', async (_, code: string) => {
    return await stateService.getByCode(code);
  });

  ipcMain.handle('directory:state:search', async (_, query: string) => {
    return await stateService.search(query);
  });
}
