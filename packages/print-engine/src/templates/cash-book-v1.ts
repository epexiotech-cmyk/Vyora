import { CashBookReportDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { cashBookTemplate } from './cash-book-v1.template';

export const CashBookV1: TemplateDefinition<CashBookReportDto> = {
  metadata: {
    id: 'cash-book-v1',
    name: 'Cash Book',
    version: '1.0.0',
    description: 'Standard A4 Cash Book',
    supportedDocumentTypes: ['CASH_BOOK'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(cashBookTemplate);
    return template(payload);
  },
};
