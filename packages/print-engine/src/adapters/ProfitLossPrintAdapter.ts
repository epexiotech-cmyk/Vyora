import type { ProfitLossReport } from '@vyora/types';

import type { PrintPayload } from '../types';

export class ProfitLossPrintAdapter {
  public static toPayload(report: ProfitLossReport): PrintPayload<ProfitLossReport> {
    return {
      documentType: 'PROFIT_LOSS',
      data: report,
    };
  }
}
