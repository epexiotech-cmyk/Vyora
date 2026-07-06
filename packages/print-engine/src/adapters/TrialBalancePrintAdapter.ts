import type { TrialBalanceDto } from '@vyora/types';

import type { PrintPayload } from '../types';

export class TrialBalancePrintAdapter {
  public static toPayload(report: TrialBalanceDto): PrintPayload<TrialBalanceDto> {
    return {
      documentType: 'TRIAL_BALANCE',
      data: report,
    };
  }
}
