import { LedgerStatementReport } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { ledgerStatementTemplate } from './ledger-statement-v1.template';

export const LedgerStatementV1: TemplateDefinition<LedgerStatementReport> = {
  metadata: {
    id: 'ledger-statement-v1',
    name: 'Ledger Statement',
    version: '1.0.0',
    description: 'Standard A4 Ledger Statement',
    supportedDocumentTypes: ['LEDGER_STATEMENT'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(ledgerStatementTemplate);
    return template(payload);
  },
};
