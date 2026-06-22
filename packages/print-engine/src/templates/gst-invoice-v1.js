import Handlebars from 'handlebars';

import { gstInvoiceCss } from '../styles/gst-invoice.css';

import { gstInvoiceTemplate } from './gst-invoice-v1.template';
let compiledTemplate = null;
export const GstInvoiceV1 = {
  metadata: {
    id: 'gst-invoice-v1',
    name: 'Standard GST Invoice',
    version: '1.0.0',
    description: 'Production-ready GST compliant tax invoice template',
    supportedDocumentTypes: ['TAX_INVOICE'],
  },
  render: async (payload) => {
    if (!compiledTemplate) {
      compiledTemplate = Handlebars.compile(gstInvoiceTemplate);
    }
    // Mix in the CSS so it's available in the template context
    const context = {
      ...payload.data,
      css: gstInvoiceCss,
    };
    return compiledTemplate(context);
  },
};
