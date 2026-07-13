export interface PrintOptions {
  printBackground?: boolean;
  landscape?: boolean;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: string | { width: number; height: number };
}

export interface PrintPayload<T = unknown> {
  documentType:
    | 'TAX_INVOICE'
    | 'PROFORMA'
    | 'CREDIT_NOTE'
    | 'DEBIT_NOTE'
    | 'TRIAL_BALANCE'
    | 'PROFIT_LOSS'
    | 'BALANCE_SHEET'
    | 'GENERAL_LEDGER'
    | 'LEDGER_STATEMENT'
    | 'DAY_BOOK'
    | 'CASH_BOOK'
    | 'BANK_BOOK'
    | 'OUTSTANDING_REPORT';
  data: T;
}

export interface TemplateMetadata {
  id: string; // e.g., 'gst-invoice-v1'
  name: string;
  version: string;
  description?: string;
  supportedDocumentTypes: string[];
}

export interface TemplateDefinition<T = unknown> {
  metadata: TemplateMetadata;
  render: (payload: PrintPayload<T>) => Promise<string>;
}
