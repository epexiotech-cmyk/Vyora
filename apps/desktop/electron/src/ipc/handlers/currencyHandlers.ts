import { ipcMain } from 'electron';

import { currencyService } from '../../modules/directories/currency/CurrencyService';
import { loggerService } from '../../services/logger/LoggerService';

export function registerCurrencyHandlers() {
  ipcMain.handle('directory:currency:get', async (_, code: string) => {
    loggerService.debug(`[IPC] directory:currency:get called with ${code}`);
    return currencyService.getByCode(code);
  });

  ipcMain.handle('directory:currency:search', async (_, query: string) => {
    loggerService.debug(`[IPC] directory:currency:search called with ${query}`);
    return currencyService.search(query);
  });

  ipcMain.handle('directory:currency:getActive', async () => {
    loggerService.debug(`[IPC] directory:currency:getActive called`);
    return currencyService.getActive();
  });

  ipcMain.handle('directory:currency:getPrimary', async () => {
    loggerService.debug(`[IPC] directory:currency:getPrimary called`);
    return currencyService.getPrimary();
  });
}
