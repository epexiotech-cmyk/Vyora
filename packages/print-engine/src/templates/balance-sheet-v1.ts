import Handlebars from 'handlebars';

import type { TemplateDefinition } from '../types';

import { balanceSheetTemplate } from './balance-sheet-v1.template';

export const BalanceSheetV1: TemplateDefinition = {
  metadata: {
    id: 'balance-sheet-v1',
    name: 'Balance Sheet (Standard)',
    version: '1.0.0',
    description: 'Standard A4 portrait template for Balance Sheet reports.',
    supportedDocumentTypes: ['BALANCE_SHEET'],
  },
  render: async (payload) => {
    const template = Handlebars.compile(balanceSheetTemplate);
    return template(payload);
  },
};
