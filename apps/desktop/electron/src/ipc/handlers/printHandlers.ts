import { ipcMain, WebContentsPrintOptions, PrintToPDFOptions } from 'electron';

import { printService } from '../../services/PrintService';

export function registerPrintHandlers(): void {
  ipcMain.handle('print:export-pdf', async (event, html: string, options?: PrintToPDFOptions) => {
    return await printService.exportPdf(html, options);
  });

  ipcMain.handle('print:print', async (event, html: string, options?: WebContentsPrintOptions) => {
    return await printService.print(html, options);
  });
}
