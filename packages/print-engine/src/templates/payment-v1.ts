import { SettlementDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { template } from './payment-v1.template';

export const PaymentV1: TemplateDefinition<SettlementDto> = {
  metadata: {
    id: 'payment-v1',
    name: 'Payment Voucher',
    version: '1.0.0',
    description: 'Standard A4 Payment Voucher',
    supportedDocumentTypes: ['PAYMENT'],
  },
  render: async (payload) => {
    return template(payload);
  },
};
