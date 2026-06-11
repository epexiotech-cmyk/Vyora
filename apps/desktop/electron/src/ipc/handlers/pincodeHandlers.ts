import { ipcMain } from 'electron';

import { pincodeService } from '../../modules/directories/pincode/PincodeService';
import { smartPincodeLookupService } from '../../modules/directories/pincode/SmartPincodeLookupService';
import { loggerService } from '../../services/logger/LoggerService';

export function registerPincodeHandlers() {
  ipcMain.handle('directory:pincode:get', async (_, pincode: string) => {
    loggerService.debug(`[IPC] directory:pincode:get called with ${pincode}`);
    return await pincodeService.getByPincode(pincode);
  });

  ipcMain.handle('directory:pincode:smartLookup', async (_, pincode: string) => {
    loggerService.debug(`[IPC] directory:pincode:smartLookup called with ${pincode}`);
    return await smartPincodeLookupService.lookup(pincode);
  });

  ipcMain.handle(
    'directory:pincode:search',
    async (_, query: { pincode?: string; district?: string; state?: string }) => {
      loggerService.debug(`[IPC] directory:pincode:search called with ${JSON.stringify(query)}`);
      return await pincodeService.search(query);
    },
  );
}
