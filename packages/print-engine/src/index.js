import Handlebars from 'handlebars';

import { TemplateRegistry } from './registry/TemplateRegistry';
import { GstInvoiceV1 } from './templates/gst-invoice-v1';
import { formatCurrencyINR } from './utils/formatCurrency';
export * from './utils/numberToWords';
let isRegistered = false;
export function registerAllTemplates() {
  if (isRegistered) return;
  // Register Handlebars helpers
  Handlebars.registerHelper('formatCurrency', function (value) {
    if (value === undefined || value === null) return '0.00';
    return formatCurrencyINR(value);
  });
  Handlebars.registerHelper('formatDate', function (dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });
  Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
      '+': lvalue + rvalue,
      '-': lvalue - rvalue,
      '*': lvalue * rvalue,
      '/': lvalue / rvalue,
      '%': lvalue % rvalue,
    }[operator];
  });
  // Register templates
  TemplateRegistry.register(GstInvoiceV1);
  isRegistered = true;
}
export async function renderDocument(templateName, payload) {
  if (!isRegistered) {
    registerAllTemplates();
  }
  const template = TemplateRegistry.get(templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found in registry`);
  }
  return template.render(payload);
}
