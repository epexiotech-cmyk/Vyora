import { GeneralLedgerReport } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { generalLedgerTemplate } from './general-ledger-v1.template';

export const GeneralLedgerV1: TemplateDefinition<GeneralLedgerReport> = {
  metadata: {
    id: 'general-ledger-v1',
    name: 'General Ledger',
    version: '1.0.0',
    description: 'Standard A4 General Ledger Report',
    supportedDocumentTypes: ['GENERAL_LEDGER'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(generalLedgerTemplate);
    return template(payload);
  },
};
