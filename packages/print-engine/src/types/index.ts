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
  documentType: 'TAX_INVOICE' | 'PROFORMA' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
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
