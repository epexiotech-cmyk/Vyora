import { DocumentType, DocumentNumberingConfigDto, FyFormat } from '@vyora/types';

import { DocumentNumberingRepository } from '../repositories/DocumentNumberingRepository';

import { FinancialYearService } from './FinancialYearService';

export class DocumentNumberingService {
  private repo = new DocumentNumberingRepository();
  private fyService = new FinancialYearService();

  /**
   * Generates and atomically increments the document number for the specified document type.
   * MUST be run within an existing database transaction.
   */
  public generateNextNumberSync(
    companyId: string,
    documentType: DocumentType,
    financialYearId: string | null,
    tx: import('../repositories/BaseRepository').TransactionExecutor,
  ): string {
    // 1. Fetch Config
    let config = this.repo.getConfigSync(companyId, documentType, tx);

    // If no config exists, create a default one
    if (!config) {
      config = {
        documentType,
        prefix: this.getDefaultPrefix(documentType),
        formatTemplate: '{{PREFIX}}-{{FY}}-{{SEQ}}',
        fyFormat: 'YY-YY',
        startingNumber: 1,
        zeroPadding: 4,
        resetYearly: true,
      };
      this.repo.saveConfigSync(companyId, config, tx);
    }

    // 2. Resolve FY string if needed
    let fyString = '';
    const fyTargetId = config.resetYearly ? financialYearId : null;

    if (config.formatTemplate.includes('{{FY}}') && financialYearId) {
      const fyEntity = this.fyService.getByIdSync(
        financialYearId,
        tx as import('../repositories/BaseRepository').DbTransaction,
      );
      if (fyEntity) {
        fyString = this.formatFinancialYear(
          new Date(fyEntity.startDate),
          new Date(fyEntity.endDate),
          config.fyFormat,
        );
      }
    }

    // 3. Atomically increment sequence
    const sequenceValue = this.repo.incrementAndGetSequenceSync(
      companyId,
      documentType,
      fyTargetId,
      tx,
      config.startingNumber,
    );

    // 4. Compile Format
    return this.compileFormat(config, sequenceValue, fyString);
  }

  public previewFormat(config: DocumentNumberingConfigDto): string {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    const fyString = this.formatFinancialYear(now, nextYear, config.fyFormat);
    return this.compileFormat(config, config.startingNumber, fyString);
  }

  private compileFormat(
    config: DocumentNumberingConfigDto,
    sequence: number,
    fyString: string,
  ): string {
    const seqString = sequence.toString().padStart(config.zeroPadding, '0');

    let result = config.formatTemplate;

    // Some formats might omit PREFIX entirely. We replace it if it's there.
    if (result.includes('{{PREFIX}}')) {
      const prefix = config.prefix ? config.prefix : '';
      result = result.replace(/\{\{PREFIX\}\}-?/g, prefix ? `${prefix}-` : '');
      // Simple replace for exact token
      result = result.replace('{{PREFIX}}', prefix);
    }

    result = result.replace('{{FY}}', fyString);
    result = result.replace('{{SEQ}}', seqString);

    // Clean up trailing/leading dashes just in case a component was empty
    result = result.replace(/^-+|-+$/g, '');
    result = result.replace(/-{2,}/g, '-');

    return result;
  }

  private formatFinancialYear(start: Date, end: Date, format: FyFormat): string {
    const startY = start.getFullYear();
    const endY = end.getFullYear();
    const startY2 = startY.toString().slice(-2);
    const endY2 = endY.toString().slice(-2);

    switch (format) {
      case 'YY-YY':
        return `${startY2}-${endY2}`;
      case 'YYYY-YY':
        return `${startY}-${endY2}`;
      case 'YYYY-YYYY':
        return `${startY}-${endY}`;
      case 'FYYY-YY':
        return `FY${startY2}-${endY2}`;
      default:
        return `${startY2}-${endY2}`;
    }
  }

  private getDefaultPrefix(type: DocumentType): string {
    switch (type) {
      case DocumentType.SALES_INVOICE:
        return 'INV';
      case DocumentType.PURCHASE_INVOICE:
        return 'PUR';
      case DocumentType.QUOTATION:
        return 'QTN';
      case DocumentType.DELIVERY_CHALLAN:
        return 'DC';
      case DocumentType.SALES_RETURN:
        return 'SR';
      case DocumentType.PURCHASE_RETURN:
        return 'PR';
      case DocumentType.CREDIT_NOTE:
        return 'CN';
      case DocumentType.DEBIT_NOTE:
        return 'DN';
      case DocumentType.RECEIPT_VOUCHER:
        return 'RV';
      case DocumentType.PAYMENT_VOUCHER:
        return 'PV';
      case DocumentType.JOURNAL_VOUCHER:
        return 'JV';
      case DocumentType.CONTRA_VOUCHER:
        return 'CV';
      case DocumentType.CUSTOMER:
        return 'CUST';
      case DocumentType.SUPPLIER:
        return 'SUPP';
      case DocumentType.ITEM:
        return 'ITEM';
      default:
        return '';
    }
  }

  public async getConfig(
    companyId: string,
    documentType: string,
  ): Promise<DocumentNumberingConfigDto | null> {
    return this.repo.getConfig(companyId, documentType as DocumentType);
  }

  public async saveConfig(
    companyId: string,
    documentType: string,
    template: string,
  ): Promise<DocumentNumberingConfigDto> {
    // We are hacking template saving since the full config is requested. We should really accept DocumentNumberingConfigDto.
    // For now, let's just get the existing config and update its formatTemplate.
    let config = await this.repo.getConfig(companyId, documentType as DocumentType);
    if (!config) {
      config = {
        documentType: documentType as DocumentType,
        prefix: this.getDefaultPrefix(documentType as DocumentType),
        formatTemplate: template,
        fyFormat: 'YY-YY',
        startingNumber: 1,
        zeroPadding: 4,
        resetYearly: true,
      };
    } else {
      config.formatTemplate = template;
    }

    await this.repo.saveConfig(companyId, config);
    return config;
  }

  public async saveFullConfig(
    companyId: string,
    config: DocumentNumberingConfigDto,
  ): Promise<DocumentNumberingConfigDto> {
    await this.repo.saveConfig(companyId, config);
    return config;
  }

  public async getAllConfigs(companyId: string): Promise<DocumentNumberingConfigDto[]> {
    return this.repo.getAllConfigs(companyId);
  }
}

export const documentNumberingService = new DocumentNumberingService();
