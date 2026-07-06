import Handlebars from 'handlebars';

import { TemplateRegistry } from './registry/TemplateRegistry';
import { GstInvoiceV1 } from './templates/gst-invoice-v1';
import { ProfitLossV1 } from './templates/profit-loss-v1';
import { TrialBalanceV1 } from './templates/trial-balance-v1';
import { formatCurrencyINR } from './utils/formatCurrency';

export * from './utils/numberToWords';
export * from './types';
export * from './registry/TemplateRegistry';
export * from './renderers';
export * from './adapters/SalesInvoicePrintAdapter';
export * from './adapters/TrialBalancePrintAdapter';
export * from './adapters/ProfitLossPrintAdapter';

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
  Handlebars.registerHelper('math', function (lvalue: unknown, operator: string, rvalue: unknown) {
    const left = parseFloat(String(lvalue));
    const right = parseFloat(String(rvalue));
    switch (operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      default:
        return 0;
    }
  });
  // Register templates
  TemplateRegistry.register(GstInvoiceV1);
  TemplateRegistry.register(TrialBalanceV1);
  TemplateRegistry.register(ProfitLossV1);
  isRegistered = true;
}

export async function renderDocument<T = unknown>(
  templateName: string,
  payload: import('./types').PrintPayload<T>,
) {
  if (!isRegistered) {
    registerAllTemplates();
  }
  const template = TemplateRegistry.get<T>(templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found in registry`);
  }
  return template.render(payload);
}
