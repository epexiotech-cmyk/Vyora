import { LedgerStatementReport } from '@vyora/types';

import { PrintPayload } from '../types';

export class LedgerStatementPrintAdapter {
  static toPayload(report: LedgerStatementReport): PrintPayload<LedgerStatementReport> {
    return {
      documentType: 'LEDGER_STATEMENT',
      data: report,
    };
  }
}
