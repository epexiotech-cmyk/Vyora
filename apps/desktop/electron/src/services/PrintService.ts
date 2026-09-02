import * as fs from 'fs';
import * as path from 'path';

import { renderDocument, type PrintPayload } from '@vyora/print-engine';
import { BrowserWindow, dialog, app, shell } from 'electron';
import type { WebContentsPrintOptions, PrintToPDFOptions } from 'electron';

import { companyRepository } from '../repositories/CompanyRepository';
import { paymentAccountRepository } from '../repositories/PaymentAccountRepository';

import { fileSystemService } from './filesystem/FileSystemService';

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

  private async injectBase64Images<T>(payload: PrintPayload<T>) {
    const p = payload as unknown as {
      data?: {
        companyId?: string;
        companyLogoPath?: string;
        companySignaturePath?: string;
        companySignatureDesignation?: string;
        _showQrOnInvoice?: boolean;
        _showBankDetailsOnInvoice?: boolean;
        paymentAccountId?: string;
        signatureId?: string;
        _accountHolderNameSnapshot?: string | null;
      };
    };
    if (p && p.data && p.data.companyId) {
      try {
        const company = await companyRepository.getById(p.data.companyId);
        if (company) {
          p.data._showQrOnInvoice = company.showQrOnInvoice ?? false;
          p.data._showBankDetailsOnInvoice = company.showBankDetailsOnInvoice ?? false;

          let selectedSignature = undefined;
          if (p.data.signatureId) {
            selectedSignature = company.signatures?.find((s) => s.id === p.data!.signatureId);
          }
          if (!selectedSignature) {
            selectedSignature = company.signatures?.find((s) => s.isDefault);
          }

          if (selectedSignature) {
            p.data.companySignaturePath = selectedSignature.filePath;
            p.data.companySignatureDesignation = selectedSignature.designation;
          } else if (company.signaturePath) {
            p.data.companySignaturePath = company.signaturePath;
            p.data.companySignatureDesignation = 'Authorized Signatory';
          }
        }

        if (p.data.paymentAccountId) {
          const paymentAccount = await paymentAccountRepository.getById(p.data.paymentAccountId);
          if (paymentAccount) {
            p.data._accountHolderNameSnapshot = paymentAccount.accountHolderName;
          }
        }

        const logoPath = p.data.companyLogoPath;
        if (logoPath && !logoPath.startsWith('data:')) {
          const absolutePath = fileSystemService.getCompanyLogoPath(p.data.companyId, logoPath);
          if (fs.existsSync(absolutePath)) {
            const ext = path.extname(absolutePath).slice(1);
            const base64 = fs.readFileSync(absolutePath, 'base64');
            p.data.companyLogoPath = `data:image/${ext || 'png'};base64,${base64}`;
          }
        }

        const signaturePath = p.data.companySignaturePath;
        if (signaturePath && !signaturePath.startsWith('data:')) {
          const absolutePath = fileSystemService.getCompanySignaturePath(
            p.data.companyId,
            signaturePath,
          );
          if (fs.existsSync(absolutePath)) {
            const ext = path.extname(absolutePath).slice(1);
            const base64 = fs.readFileSync(absolutePath, 'base64');
            p.data.companySignaturePath = `data:image/${ext || 'png'};base64,${base64}`;
          }
        }
      } catch (e) {
        console.error('Failed to prepare print payload data', e);
      }
    }
  }

  public async render<T>(templateName: string, payload: PrintPayload<T>): Promise<string> {
    await this.injectBase64Images(payload);
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
          const payload = payloadOrOptions as PrintPayload<T>;
          await this.injectBase64Images(payload);
          html = await renderDocument(templateNameOrHtml, payload);
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
      await this.injectBase64Images(payload);
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
  public async saveTempPdfAndShare<T>(
    templateName: string,
    payload: PrintPayload<T>,
    fileName: string,
    options?: PrintToPDFOptions,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return this.enqueue(async () => {
      try {
        await this.injectBase64Images(payload);
        const html = await renderDocument(templateName, payload);
        const win = await this.getHiddenWindow();

        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          ...options,
        });

        const tempDir = app.getPath('temp');
        const filePath = path.join(tempDir, fileName);
        await fs.promises.writeFile(filePath, pdfBuffer);

        await win.loadURL('about:blank');

        // Show the generated PDF in folder so user can drag-drop / share it natively
        shell.showItemInFolder(filePath);

        return { success: true, filePath };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
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
