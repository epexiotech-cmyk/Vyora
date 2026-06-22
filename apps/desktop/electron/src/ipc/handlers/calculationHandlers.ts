import { CalculationEngineInput, InvoiceCalculationResult } from '@vyora/types';

import { CalculationEngine } from '../../services/CalculationEngine';
import { createIpcHandler } from '../wrapper';

export function registerCalculationHandlers() {
  createIpcHandler<InvoiceCalculationResult>(
    'calculation:calculateInvoice',
    async (_event, input: CalculationEngineInput) => {
      const result = CalculationEngine.calculate(input);
      return { success: true, data: result };
    },
  );
}
