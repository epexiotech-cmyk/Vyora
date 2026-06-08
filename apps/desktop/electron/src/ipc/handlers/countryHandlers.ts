import { ipcMain } from 'electron';

import { countryService } from '../../modules/directories/country/CountryService';
import { loggerService } from '../../services/logger/LoggerService';

export function registerCountryHandlers() {
  ipcMain.handle('directory:country:get', async (_, code: string) => {
    loggerService.debug(`[IPC] directory:country:get called with ${code}`);
    return countryService.getByCode(code);
  });

  ipcMain.handle('directory:country:search', async (_, query: string) => {
    loggerService.debug(`[IPC] directory:country:search called with ${query}`);
    return countryService.search(query);
  });
}
