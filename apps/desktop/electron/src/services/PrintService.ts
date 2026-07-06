import * as fs from 'fs';

import { renderDocument, type PrintPayload } from '@vyora/print-engine';
import { BrowserWindow, dialog } from 'electron';
import type { WebContentsPrintOptions, PrintToPDFOptions } from 'electron';

type PrintTask<T> = () => Promise<T>;

export class PrintService {
  private hiddenWindow: BrowserWindow | null = null;
  private isProcessingQueue = false;
  private queue: PrintTask<unknown>[] = [];

  private async getHiddenWindow(): Promise<BrowserWindow> {
    if (!this.hiddenWindow) {
      this.hiddenWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      this.hiddenWindow.on('closed', () => {
        this.hiddenWindow = null;
      });
    }
    return this.hiddenWindow;
  }

  private async enqueue<T>(task: PrintTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('Print queue task failed:', error);
      }
    }

    // Process next task
    this.processQueue();
  }

  public async render<T>(templateName: string, payload: PrintPayload<T>): Promise<string> {
    return renderDocument(templateName, payload);
  }

  public async print<T>(
    templateNameOrHtml: string,
    payloadOrOptions?: PrintPayload<T> | WebContentsPrintOptions,
    options?: WebContentsPrintOptions,
  ): Promise<{ success: boolean; failureReason?: string }> {
    return this.enqueue(async () => {
      try {
        let html: string;
        let printOpts: WebContentsPrintOptions | undefined;

        if (payloadOrOptions && 'documentType' in payloadOrOptions) {
          html = await renderDocument(templateNameOrHtml, payloadOrOptions as PrintPayload<T>);
          printOpts = options;
        } else {
          html = templateNameOrHtml;
          printOpts = payloadOrOptions as WebContentsPrintOptions;
        }

        const win = await this.getHiddenWindow();
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

        const result = await new Promise<{ success: boolean; failureReason?: string }>(
          (resolve) => {
            win.webContents.print(
              {
                silent: false,
                printBackground: true,
                ...printOpts,
              },
              (success, failureReason) => {
                resolve({ success, failureReason });
              },
            );
          },
        );

        await win.loadURL('about:blank');
        return result;
      } catch (error) {
        return {
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  public async printToPdf<T>(
    templateName: string,
    payload: PrintPayload<T>,
    options?: PrintToPDFOptions,
  ): Promise<{ buffer: Buffer }> {
    return this.enqueue(async () => {
      const html = await renderDocument(templateName, payload);
      const win = await this.getHiddenWindow();

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        ...options,
      });

      await win.loadURL('about:blank');

      return { buffer: pdfBuffer };
    });
  }

  public async exportPdf(html: string, options?: PrintToPDFOptions): Promise<{ filePath: string }> {
    return this.enqueue(async () => {
      const win = await this.getHiddenWindow();
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      const pdfBuffer = await win.webContents.printToPDF({
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
        await win.loadURL('about:blank');
        throw new Error('PDF export cancelled by user');
      }

      await fs.promises.writeFile(filePath, pdfBuffer);
      await win.loadURL('about:blank');

      return { filePath };
    });
  }

  public async getAvailablePrinters() {
    const win = await this.getHiddenWindow();
    return win.webContents.getPrintersAsync();
  }
}

export const printService = new PrintService();
