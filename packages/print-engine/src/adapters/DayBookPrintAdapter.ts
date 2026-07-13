import { DayBookReportDto } from '@vyora/types';

import { PrintPayload } from '../types';

export class DayBookPrintAdapter {
  static toPayload(report: DayBookReportDto): PrintPayload<DayBookReportDto> {
    return {
      documentType: 'DAY_BOOK',
      data: report,
    };
  }
}
