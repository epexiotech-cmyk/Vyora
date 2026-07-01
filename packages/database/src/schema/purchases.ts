import { sqliteTable, text, integer, index, unique, real } from 'drizzle-orm/sqlite-core';

import { suppliers, products, units, taxes, tax_groups } from './master';
import { companies, financial_years, states } from './system';

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
    purchaseNumber: text('purchase_number').notNull(),
    purchaseDate: integer('purchase_date', { mode: 'timestamp' }).notNull(),
    placeOfSupplyStateId: text('place_of_supply_state_id').references(() => states.id),
    isReverseCharge: integer('is_reverse_charge', { mode: 'boolean' }).default(false).notNull(),
    supplierId: text('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    supplierName: text('supplier_name').notNull(),
    supplierGstin: text('supplier_gstin'),
    supplierInvoiceNumber: text('supplier_invoice_number'),
    supplierInvoiceDate: integer('supplier_invoice_date', { mode: 'timestamp' }),
    subtotal: integer('subtotal').default(0).notNull(),
    discountAmount: integer('discount_amount').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    roundOffAmount: integer('round_off_amount').default(0).notNull(),
    grandTotal: integer('grand_total').default(0).notNull(),
    notes: text('notes'),
    status: text('status').notNull(), // 'DRAFT' | 'COMPLETED' | 'CANCELLED'
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    syncVersion: integer('sync_version').default(1).notNull(),
  },
  (table) => [
    index('purchase_invoices_company_fy_idx').on(table.companyId, table.financialYearId),
    index('purchase_invoices_date_idx').on(table.companyId, table.purchaseDate),
    index('purchase_invoices_supplier_idx').on(table.companyId, table.supplierId),
    index('purchase_invoices_supp_inv_idx').on(table.companyId, table.supplierInvoiceNumber),
    index('purchase_invoices_status_idx').on(table.companyId, table.status),
    index('purchase_invoices_deleted_idx').on(table.companyId, table.deletedAt),
    unique('purchase_invoices_company_purchase_number_idx').on(
      table.companyId,
      table.purchaseNumber,
    ),
  ],
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
    itemName: text('item_name').notNull(),
    itemCode: text('item_code'),
    unitId: text('unit_id')
      .references(() => units.id)
      .notNull(),
    unitShortName: text('unit_short_name').notNull(),
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
    taxPercentage: integer('tax_percentage').default(0).notNull(), // kept for backward compat
    hsnCode: text('hsn_code'),
    description: text('description'),
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
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    syncVersion: integer('sync_version').default(1).notNull(),
  },
  (table) => [
    index('purchase_items_invoice_idx').on(table.purchaseInvoiceId),
    index('purchase_items_product_idx').on(table.productId),
    index('purchase_items_tax_idx').on(table.taxId),
  ],
);
