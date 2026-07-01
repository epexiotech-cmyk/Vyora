import { sqliteTable, text, integer, index, real } from 'drizzle-orm/sqlite-core';

import { customers, products, units, taxes, tax_groups } from './master';
import { companies, financial_years, states } from './system';

export const sales_invoices = sqliteTable(
  'sales_invoices',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    customerId: text('customer_id')
      .references(() => customers.id)
      .notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    invoiceDate: integer('invoice_date', { mode: 'timestamp' }).notNull(),
    placeOfSupplyStateId: text('place_of_supply_state_id').references(() => states.id),
    isReverseCharge: integer('is_reverse_charge', { mode: 'boolean' }).default(false).notNull(),
    subtotal: integer('subtotal').default(0).notNull(),
    discountAmount: integer('discount_amount').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    roundOffAmount: integer('round_off_amount').default(0).notNull(),
    grandTotal: integer('grand_total').default(0).notNull(),
    notes: text('notes'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('sales_invoices_company_fy_idx').on(table.companyId, table.financialYearId),
    index('sales_invoices_date_idx').on(table.invoiceDate),
    index('sales_invoices_customer_idx').on(table.customerId),
  ],
);

export const sales_invoice_items = sqliteTable(
  'sales_invoice_items',
  {
    id: text('id').primaryKey(),
    salesInvoiceId: text('sales_invoice_id')
      .references(() => sales_invoices.id)
      .notNull(),
    productId: text('product_id')
      .references(() => products.id)
      .notNull(),
    unitId: text('unit_id')
      .references(() => units.id)
      .notNull(),
    taxId: text('tax_id')
      .references(() => taxes.id)
      .notNull(), // kept for backward compat if needed
    taxGroupId: text('tax_group_id').references(() => tax_groups.id),
    taxGroupCodeSnapshot: text('tax_group_code_snapshot'),
    taxGroupNameSnapshot: text('tax_group_name_snapshot'),
    taxRateSnapshot: real('tax_rate_snapshot'),
    cgstRateSnapshot: real('cgst_rate_snapshot'),
    sgstRateSnapshot: real('sgst_rate_snapshot'),
    igstRateSnapshot: real('igst_rate_snapshot'),
    cessRateSnapshot: real('cess_rate_snapshot'),
    description: text('description'),
    hsnCode: text('hsn_code'),
    quantity: integer('quantity').default(0).notNull(),
    rate: integer('rate').default(0).notNull(),
    discountAmount: integer('discount_amount').default(0).notNull(),
    taxableAmount: integer('taxable_amount').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    cgstAmount: integer('cgst_amount').default(0).notNull(),
    sgstAmount: integer('sgst_amount').default(0).notNull(),
    igstAmount: integer('igst_amount').default(0).notNull(),
    cessAmount: integer('cess_amount').default(0).notNull(),
    lineTotal: integer('line_total').default(0).notNull(),
  },
  (table) => [
    index('sales_items_invoice_idx').on(table.salesInvoiceId),
    index('sales_items_product_idx').on(table.productId),
  ],
);
