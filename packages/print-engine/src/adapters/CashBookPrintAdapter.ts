import { CashBookReportDto } from '@vyora/types';

import { PrintPayload } from '../types';

export class CashBookPrintAdapter {
  static toPayload(report: CashBookReportDto): PrintPayload<CashBookReportDto> {
    return {
      documentType: 'CASH_BOOK',
      data: report,
    };
  }
}
