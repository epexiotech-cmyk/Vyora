import { OutstandingSummaryDto } from '@vyora/types';

import { PrintPayload } from '../types';

export class OutstandingPrintAdapter {
  static toPayload(report: OutstandingSummaryDto): PrintPayload<OutstandingSummaryDto> {
    return {
      documentType: 'OUTSTANDING_REPORT',
      data: report,
    };
  }
}
