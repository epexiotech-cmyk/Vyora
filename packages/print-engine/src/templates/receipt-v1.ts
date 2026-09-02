import { SettlementDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { template } from './receipt-v1.template';

export const ReceiptV1: TemplateDefinition<SettlementDto> = {
  metadata: {
    id: 'receipt-v1',
    name: 'Receipt Voucher',
    version: '1.0.0',
    description: 'Standard A4 Receipt Voucher',
    supportedDocumentTypes: ['RECEIPT'],
  },
  render: async (payload) => {
    return template(payload);
  },
};
