import Handlebars from 'handlebars';

import type { TemplateDefinition } from '../types';

import { trialBalanceTemplate } from './trial-balance-v1.template';

export const TrialBalanceV1: TemplateDefinition = {
  metadata: {
    id: 'trial-balance-v1',
    name: 'Standard Trial Balance',
    version: '1.0.0',
    description: 'Standard A4 portrait template for trial balance reports.',
    supportedDocumentTypes: ['TRIAL_BALANCE'],
  },
  render: async (payload) => {
    const template = Handlebars.compile(trialBalanceTemplate);
    return template(payload);
  },
};
