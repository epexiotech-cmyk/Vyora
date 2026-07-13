import { OutstandingSummaryDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { outstandingTemplate } from './outstanding-v1.template';

export const OutstandingV1: TemplateDefinition<OutstandingSummaryDto> = {
  metadata: {
    id: 'outstanding-v1',
    name: 'Outstanding Report',
    version: '1.0.0',
    description: 'Standard A4 Outstanding Report',
    supportedDocumentTypes: ['OUTSTANDING_REPORT'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(outstandingTemplate);
    return template(payload);
  },
};
