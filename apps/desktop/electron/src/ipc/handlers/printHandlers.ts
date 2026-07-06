import type { PrintPayload } from '@vyora/print-engine';
import { ipcMain } from 'electron';
import type { WebContentsPrintOptions, PrintToPDFOptions } from 'electron';

import { printService } from '../../services/PrintService';

export function registerPrintHandlers() {
  ipcMain.handle(
    'print:render',
    async (_, templateName: string, payload: PrintPayload<unknown>) => {
      return await printService.render(templateName, payload);
    },
  );

  ipcMain.handle(
    'print:print',
    async (
      _,
      templateNameOrHtml: string,
      payloadOrOptions?: PrintPayload<unknown> | WebContentsPrintOptions,
      options?: WebContentsPrintOptions,
    ) => {
      return await printService.print(
        templateNameOrHtml,
        payloadOrOptions as PrintPayload<unknown>,
        options,
      );
    },
  );

  ipcMain.handle(
    'print:printToPdf',
    async (
      _,
      templateName: string,
      payload: PrintPayload<unknown>,
      options?: PrintToPDFOptions,
    ) => {
      const result = await printService.printToPdf(templateName, payload, options);
      // Return array buffer so it can cross IPC
      return result.buffer.buffer;
    },
  );

  ipcMain.handle('print:exportPdf', async (_, html: string, options?: PrintToPDFOptions) => {
    return await printService.exportPdf(html, options);
  });

  ipcMain.handle('print:getAvailablePrinters', async () => {
    return await printService.getAvailablePrinters();
  });
}
