import { BankBookReportDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { bankBookTemplate } from './bank-book-v1.template';

export const BankBookV1: TemplateDefinition<BankBookReportDto> = {
  metadata: {
    id: 'bank-book-v1',
    name: 'Bank Book',
    version: '1.0.0',
    description: 'Standard A4 Bank Book',
    supportedDocumentTypes: ['BANK_BOOK'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(bankBookTemplate);
    return template(payload);
  },
};
