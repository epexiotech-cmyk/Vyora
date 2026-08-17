import { sqliteTable, text, integer, index, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
    placeOfSupplyCode: text('place_of_supply_code'),
    isReverseCharge: integer('is_reverse_charge', { mode: 'boolean' }).default(false).notNull(),

    // Company Snapshots
    companyNameSnapshot: text('company_name_snapshot'),
    companyAddressSnapshot: text('company_address_snapshot'),
    companyGstinSnapshot: text('company_gstin_snapshot'),
    companyStateNameSnapshot: text('company_state_name_snapshot'),
    companyStateCodeSnapshot: text('company_state_code_snapshot'),
    companyPanSnapshot: text('company_pan_snapshot'),

    // Billing Snapshots
    billingName: text('billing_name'),
    billingAddress: text('billing_address'),
    billingCity: text('billing_city'),
    billingDistrict: text('billing_district'),
    billingPincode: text('billing_pincode'),
    billingGstin: text('billing_gstin'),
    billingStateCode: text('billing_state_code'),

    // Shipping Snapshots
    shippingName: text('shipping_name'),
    shippingAddress: text('shipping_address'),
    shippingCity: text('shipping_city'),
    shippingDistrict: text('shipping_district'),
    shippingPincode: text('shipping_pincode'),
    shippingGstin: text('shipping_gstin'),
    shippingStateCode: text('shipping_state_code'),

    // Payment Snapshots (Soft References)
    paymentAccountId: text('payment_account_id'),
    bankNameSnapshot: text('bank_name_snapshot'),
    accountNumberSnapshot: text('account_number_snapshot'),
    ifscCodeSnapshot: text('ifsc_code_snapshot'),
    branchNameSnapshot: text('branch_name_snapshot'),

    // QR Snapshots (Soft References)
    qrAccountId: text('qr_account_id'),
    upiIdSnapshot: text('upi_id_snapshot'),
    upiPayeeNameSnapshot: text('upi_payee_name_snapshot'),
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
      salesInvoicesCompanyFyIdx: index('sales_invoices_company_fy_idx').on(
        table.companyId,
        table.financialYearId,
      ),
      salesInvoicesDateIdx: index('sales_invoices_date_idx').on(table.invoiceDate),
      salesInvoicesCustomerIdx: index('sales_invoices_customer_idx').on(table.customerId),
      salesInvoicesCompanyInvNumIdx: uniqueIndex('sales_invoices_company_inv_num_idx').on(
        table.companyId,
        table.invoiceNumber,
      ),
    };
  },
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
    itemTypeSnapshot: text('item_type_snapshot', {
      enum: ['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE'],
    }),
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
