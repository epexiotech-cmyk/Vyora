import type { BalanceSheetReport } from '@vyora/types';

import type { PrintPayload } from '../types';

export class BalanceSheetPrintAdapter {
  public static toPayload(report: BalanceSheetReport): PrintPayload<BalanceSheetReport> {
    return {
      documentType: 'BALANCE_SHEET',
      data: report,
    };
  }
}
