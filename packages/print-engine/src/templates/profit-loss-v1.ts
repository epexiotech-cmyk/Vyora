import Handlebars from 'handlebars';

import type { TemplateDefinition } from '../types';

import { profitLossTemplate } from './profit-loss-v1.template';

export const ProfitLossV1: TemplateDefinition = {
  metadata: {
    id: 'profit-loss-v1',
    name: 'Profit & Loss Statement (Standard)',
    version: '1.0.0',
    description: 'Standard A4 portrait template for Profit & Loss reports.',
    supportedDocumentTypes: ['PROFIT_LOSS'],
  },
  render: async (payload) => {
    // Compile using Handlebars to support recursive partials and nested arrays
    const template = Handlebars.compile(profitLossTemplate);
    return template(payload);
  },
};
