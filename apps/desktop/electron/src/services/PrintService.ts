import * as fs from 'fs';

import { BrowserWindow, dialog, WebContentsPrintOptions, PrintToPDFOptions } from 'electron';

export class PrintService {
  public async exportPdf(html: string, options?: PrintToPDFOptions): Promise<{ filePath: string }> {
    let printWindow: BrowserWindow | null = null;
    try {
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      // Default PDF options matching A4 size
      const pdfBuffer = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        ...options,
      });

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export PDF',
        defaultPath: 'invoice.pdf',
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        throw new Error('PDF export cancelled by user');
      }

      await fs.promises.writeFile(filePath, pdfBuffer);

      return { filePath };
    } finally {
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.destroy();
      }
    }
  }

  public async print(
    html: string,
    options?: WebContentsPrintOptions,
  ): Promise<{ success: boolean; failureReason?: string }> {
    let printWindow: BrowserWindow | null = null;
    try {
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      return await new Promise((resolve) => {
        printWindow!.webContents.print(
          {
            silent: false,
            printBackground: true,
            ...options,
          },
          (success, failureReason) => {
            resolve({ success, failureReason });
          },
        );
      });
    } finally {
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.destroy();
      }
    }
  }
}

export const printService = new PrintService();
