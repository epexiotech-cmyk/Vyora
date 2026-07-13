import { DayBookReportDto } from '@vyora/types';

import { TemplateDefinition } from '../types';

import { dayBookTemplate } from './day-book-v1.template';

export const DayBookV1: TemplateDefinition<DayBookReportDto> = {
  metadata: {
    id: 'day-book-v1',
    name: 'Day Book',
    version: '1.0.0',
    description: 'Standard A4 Day Book',
    supportedDocumentTypes: ['DAY_BOOK'],
  },
  render: async (payload) => {
    const Handlebars = (await import('handlebars')).default;
    const template = Handlebars.compile(dayBookTemplate);
    return template(payload);
  },
};
