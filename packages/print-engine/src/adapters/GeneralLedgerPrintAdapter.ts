import { GeneralLedgerReport } from '@vyora/types';

import { PrintPayload } from '../types';

export class GeneralLedgerPrintAdapter {
  static toPayload(report: GeneralLedgerReport): PrintPayload<GeneralLedgerReport> {
    return {
      documentType: 'GENERAL_LEDGER',
      data: report,
    };
  }
}
