import Handlebars from 'handlebars';

import { TemplateRegistry } from './registry/TemplateRegistry';
import { BalanceSheetV1 } from './templates/balance-sheet-v1';
import { BankBookV1 } from './templates/bank-book-v1';
import { CashBookV1 } from './templates/cash-book-v1';
import { DayBookV1 } from './templates/day-book-v1';
import { GeneralLedgerV1 } from './templates/general-ledger-v1';
import { GstInvoiceV1 } from './templates/gst-invoice-v1';
import { LedgerStatementV1 } from './templates/ledger-statement-v1';
import { OutstandingV1 } from './templates/outstanding-v1';
import { ProfitLossV1 } from './templates/profit-loss-v1';
import { TrialBalanceV1 } from './templates/trial-balance-v1';
import { formatCurrencyINR } from './utils/formatCurrency';

export * from './utils/numberToWords';
export * from './types';
export * from './registry/TemplateRegistry';
export * from './renderers';
export * from './adapters/BalanceSheetPrintAdapter';
export * from './adapters/BankBookPrintAdapter';
export * from './adapters/CashBookPrintAdapter';
export * from './adapters/DayBookPrintAdapter';
export * from './adapters/GeneralLedgerPrintAdapter';
export * from './adapters/LedgerStatementPrintAdapter';
export * from './adapters/OutstandingPrintAdapter';
export * from './adapters/ProfitLossPrintAdapter';
export * from './adapters/SalesInvoicePrintAdapter';
export * from './adapters/TrialBalancePrintAdapter';

let isRegistered = false;
export function registerAllTemplates() {
  if (isRegistered) return;
  // Register Handlebars helpers
  Handlebars.registerHelper('formatCurrency', function (value, options) {
    if (value === undefined || value === null)
      return formatCurrencyINR(0, options?.data?.root?.currencyMeta);
    return formatCurrencyINR(value, options?.data?.root?.currencyMeta);
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
  TemplateRegistry.register(BalanceSheetV1);
  TemplateRegistry.register(BankBookV1);
  TemplateRegistry.register(CashBookV1);
  TemplateRegistry.register(DayBookV1);
  TemplateRegistry.register(GeneralLedgerV1);
  TemplateRegistry.register(GstInvoiceV1);
  TemplateRegistry.register(LedgerStatementV1);
  TemplateRegistry.register(OutstandingV1);
  TemplateRegistry.register(ProfitLossV1);
  TemplateRegistry.register(TrialBalanceV1);
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
