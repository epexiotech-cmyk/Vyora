import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { companies } from './system';

export const taxes = sqliteTable('taxes', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  taxType: text('tax_type').notNull().default('GST'),
  rate: real('rate').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const units = sqliteTable(
  'units',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    shortName: text('short_name').notNull(),
    uqcCode: text('uqc_code'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      companyIdIdx: index('idx_units_company_id').on(table.companyId),
      nameIdx: index('idx_units_name').on(table.companyId, table.name),
      shortNameIdx: index('idx_units_short_name').on(table.companyId, table.shortName),
      isActiveIdx: index('idx_units_is_active').on(table.companyId, table.isActive),
      deletedAtIdx: index('idx_units_deleted_at').on(table.companyId, table.deletedAt),
      nameUniqueIdx: uniqueIndex('idx_units_name_unique').on(table.companyId, table.name),
      shortNameUniqueIdx: uniqueIndex('idx_units_short_name_unique').on(
        table.companyId,
        table.shortName,
      ),
    };
  },
);

export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),

    // Identity & Contact
    customerCode: text('customer_code').notNull(),
    name: text('name').notNull(),
    contactPerson: text('contact_person'),
    mobile: text('mobile'),
    alternateMobile: text('alternate_mobile'),
    email: text('email'),

    // Address
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    area: text('area'),
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),

    // Compliance
    gstin: text('gstin'),
    pan: text('pan'),
    registrationType: text('registration_type', {
      enum: ['Regular', 'Composition', 'Unregistered', 'Consumer', 'Overseas', 'SEZ'],
    }),

    // Accounting
    openingBalance: integer('opening_balance').default(0).notNull(),
    openingType: text('opening_type', { enum: ['Dr', 'Cr'] }),
    creditLimit: integer('credit_limit').default(0).notNull(),
    creditDays: integer('credit_days').default(0).notNull(),

    // Metadata & Sync
    notes: text('notes'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      companyIdIdx: index('idx_customers_company_id').on(table.companyId),
      customerCodeIdx: uniqueIndex('idx_customers_code').on(table.companyId, table.customerCode),
      nameIdx: index('idx_customers_name').on(table.companyId, table.name),
      mobileIdx: index('idx_customers_mobile').on(table.companyId, table.mobile),
      gstinIdx: index('idx_customers_gstin').on(table.companyId, table.gstin),
    };
  },
);

export const suppliers = sqliteTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),

    // Identity & Contact
    supplierCode: text('supplier_code').notNull(),
    name: text('name').notNull(),
    contactPerson: text('contact_person'),
    mobile: text('mobile'),
    alternateMobile: text('alternate_mobile'),
    email: text('email'),

    // Address
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    area: text('area'),
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),

    // Compliance
    gstin: text('gstin'),
    pan: text('pan'),
    registrationType: text('registration_type', {
      enum: ['Regular', 'Composition', 'Unregistered', 'Overseas', 'SEZ'],
    }),

    // Accounting
    openingBalance: integer('opening_balance').default(0).notNull(),
    openingType: text('opening_type', { enum: ['Dr', 'Cr'] }),
    creditLimit: integer('credit_limit').default(0).notNull(),
    creditDays: integer('credit_days').default(0).notNull(),

    // Metadata & Sync
    notes: text('notes'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      companyIdIdx: index('idx_suppliers_company_id').on(table.companyId),
      supplierCodeIdx: uniqueIndex('idx_suppliers_code').on(table.companyId, table.supplierCode),
      nameIdx: index('idx_suppliers_name').on(table.companyId, table.name),
      mobileIdx: index('idx_suppliers_mobile').on(table.companyId, table.mobile),
      gstinIdx: index('idx_suppliers_gstin').on(table.companyId, table.gstin),
    };
  },
);

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    sku: text('sku').notNull(),
    itemType: text('item_type', {
      enum: ['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE'],
    }).notNull(),
    description: text('description'),
    hsnCode: text('hsn_code'),
    unitId: text('unit_id')
      .references(() => units.id)
      .notNull(),
    taxId: text('tax_id')
      .references(() => taxes.id)
      .notNull(),
    salePrice: integer('sale_price').default(0).notNull(),
    purchasePrice: integer('purchase_price').default(0).notNull(),
    stock: real('stock').default(0).notNull(),
    reorderLevel: real('reorder_level').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      companyIdIdx: index('idx_products_company_id').on(table.companyId),
      skuIdx: uniqueIndex('idx_products_sku').on(table.companyId, table.sku),
      nameIdx: index('idx_products_name').on(table.companyId, table.name),
      hsnCodeIdx: index('idx_products_hsn_code').on(table.companyId, table.hsnCode),
      isActiveIdx: index('idx_products_is_active').on(table.companyId, table.isActive),
      deletedAtIdx: index('idx_products_deleted_at').on(table.companyId, table.deletedAt),
    };
  },
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;
