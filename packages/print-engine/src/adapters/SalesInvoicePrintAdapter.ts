import type { SalesInvoiceDto } from '@vyora/types';

import type { PrintPayload } from '../types';

export class SalesInvoicePrintAdapter {
  public static toPayload(invoice: SalesInvoiceDto): PrintPayload<SalesInvoiceDto> {
    return {
      documentType: 'TAX_INVOICE',
      data: invoice,
    };
  }
}
