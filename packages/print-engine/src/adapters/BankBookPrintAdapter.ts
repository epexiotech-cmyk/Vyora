import { BankBookReportDto } from '@vyora/types';

import { PrintPayload } from '../types';

export class BankBookPrintAdapter {
  static toPayload(report: BankBookReportDto): PrintPayload<BankBookReportDto> {
    return {
      documentType: 'BANK_BOOK',
      data: report,
    };
  }
}
