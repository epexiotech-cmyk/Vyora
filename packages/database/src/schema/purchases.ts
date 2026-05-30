import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { suppliers, products, units, taxes } from './master';
import { companies, financial_years } from './system';

export const purchase_invoices = sqliteTable(
  'purchase_invoices',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    supplierId: text('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    supplierInvoiceNumber: text('supplier_invoice_number'),
    invoiceDate: integer('invoice_date', { mode: 'timestamp' }).notNull(),
    subtotal: integer('subtotal').default(0).notNull(),
    discountAmount: integer('discount_amount').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    roundOffAmount: integer('round_off_amount').default(0).notNull(),
    grandTotal: integer('grand_total').default(0).notNull(),
    notes: text('notes'),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => {
    return {
      companyFyIdx: index('purchase_invoices_company_fy_idx').on(
        table.companyId,
        table.financialYearId,
      ),
      invoiceDateIdx: index('purchase_invoices_date_idx').on(table.invoiceDate),
      supplierIdx: index('purchase_invoices_supplier_idx').on(table.supplierId),
    };
  },
);

export const purchase_invoice_items = sqliteTable(
  'purchase_invoice_items',
  {
    id: text('id').primaryKey(),
    purchaseInvoiceId: text('purchase_invoice_id')
      .references(() => purchase_invoices.id)
      .notNull(),
    productId: text('product_id')
      .references(() => products.id)
      .notNull(),
    unitId: text('unit_id')
      .references(() => units.id)
      .notNull(),
    taxId: text('tax_id')
      .references(() => taxes.id)
      .notNull(),
    description: text('description'),
    hsnCode: text('hsn_code'),
    quantity: integer('quantity').default(0).notNull(),
    rate: integer('rate').default(0).notNull(),
    discountAmount: integer('discount_amount').default(0).notNull(),
    taxableAmount: integer('taxable_amount').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    lineTotal: integer('line_total').default(0).notNull(),
  },
  (table) => {
    return {
      purchaseInvoiceIdx: index('purchase_items_invoice_idx').on(table.purchaseInvoiceId),
      productIdx: index('purchase_items_product_idx').on(table.productId),
    };
  },
);
