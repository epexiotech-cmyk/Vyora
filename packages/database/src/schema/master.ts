import { eq } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { ledgers } from './accounting';
import { companies, states, financial_years } from './system';

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

export const tax_groups = sqliteTable('tax_groups', {
  id: text('id').primaryKey(),
  companyId: text('company_id')
    .references(() => companies.id)
    .notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  syncVersion: integer('sync_version').default(1).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const tax_components = sqliteTable('tax_components', {
  id: text('id').primaryKey(),
  taxGroupId: text('tax_group_id')
    .references(() => tax_groups.id)
    .notNull(),
  componentType: text('component_type', {
    enum: ['CGST', 'SGST', 'IGST', 'CESS'],
  }).notNull(),
  rate: real('rate').notNull(),
  sequence: integer('sequence').default(0).notNull(),
  calculationPriority: integer('calculation_priority').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
  (table) => [
    index('idx_units_company_id').on(table.companyId),
    index('idx_units_name').on(table.companyId, table.name),
    index('idx_units_short_name').on(table.companyId, table.shortName),
    index('idx_units_is_active').on(table.companyId, table.isActive),
    index('idx_units_deleted_at').on(table.companyId, table.deletedAt),
    uniqueIndex('idx_units_name_unique').on(table.companyId, table.name),
    uniqueIndex('idx_units_short_name_unique').on(table.companyId, table.shortName),
  ],
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
    landline: text('landline'),
    email: text('email'),

    // Address
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    area: text('area'),
    city: text('city'),
    district: text('district'),
    state: text('state'), // backward compatibility
    gstStateId: text('gst_state_id').references(() => states.id),
    pincode: text('pincode'),
    shippingAddresses: text('shipping_addresses', { mode: 'json' }),

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

    // Payment Defaults (Accounting Phase 5)
    defaultPaymentAccountId: text('default_payment_account_id'),
    defaultQrAccountId: text('default_qr_account_id'),
    defaultSignatureId: text('default_signature_id'),

    // Metadata & Sync
    notes: text('notes'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_customers_company_id').on(table.companyId),
    uniqueIndex('idx_customers_code').on(table.companyId, table.customerCode),
    index('idx_customers_name').on(table.companyId, table.name),
    index('idx_customers_mobile').on(table.companyId, table.mobile),
    index('idx_customers_gstin').on(table.companyId, table.gstin),
  ],
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
    landline: text('landline'),
    email: text('email'),

    // Address
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    area: text('area'),
    city: text('city'),
    district: text('district'),
    state: text('state'), // backward compatibility
    gstStateId: text('gst_state_id').references(() => states.id),
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
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_suppliers_company_id').on(table.companyId),
    uniqueIndex('idx_suppliers_code').on(table.companyId, table.supplierCode),
    uniqueIndex('idx_suppliers_system_unique').on(table.companyId).where(eq(table.isSystem, true)),
    index('idx_suppliers_name').on(table.companyId, table.name),
    index('idx_suppliers_mobile').on(table.companyId, table.mobile),
    index('idx_suppliers_gstin').on(table.companyId, table.gstin),
  ],
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
    barcodeValue: text('barcode_value'),
    barcodeType: text('barcode_type'),
    itemType: text('item_type', {
      enum: ['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE'],
    }).notNull(),
    description: text('description'),
    hsnCode: text('hsn_code'),
    taxabilityType: text('taxability_type', {
      enum: ['Taxable', 'Nil Rated', 'Exempt', 'Non-GST'],
    })
      .default('Taxable')
      .notNull(),
    unitId: text('unit_id')
      .references(() => units.id)
      .notNull(),
    taxId: text('tax_id')
      .references(() => taxes.id)
      .notNull(),
    salePrice: integer('sale_price').default(0).notNull(),
    purchasePrice: integer('purchase_price').default(0).notNull(),
    stock: real('stock').default(0).notNull(),
    openingValuationRate: integer('opening_valuation_rate').default(0).notNull(),
    reorderLevel: real('reorder_level').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_products_company_id').on(table.companyId),
    uniqueIndex('idx_products_sku').on(table.companyId, table.sku),
    uniqueIndex('idx_products_name_unique').on(table.companyId, table.name),
    index('idx_products_hsn_code').on(table.companyId, table.hsnCode),
    index('idx_products_is_active').on(table.companyId, table.isActive),
    index('idx_products_deleted_at').on(table.companyId, table.deletedAt),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

export const expense_presets = sqliteTable(
  'expense_presets',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    ledgerId: text('ledger_id')
      .references(() => ledgers.id)
      .notNull(),
    defaultTaxGroupId: text('default_tax_group_id').references(() => tax_groups.id),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_expense_presets_company_name').on(table.companyId, table.name)],
);

export type ExpensePreset = typeof expense_presets.$inferSelect;
export type InsertExpensePreset = typeof expense_presets.$inferInsert;

// ============================================================================
// HR / Employee Masters
// ============================================================================

export const employee_types = sqliteTable(
  'employee_types',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_employee_types_company_name').on(table.companyId, table.name)],
);

export const departments = sqliteTable(
  'departments',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_departments_company_name').on(table.companyId, table.name)],
);

export const designations = sqliteTable(
  'designations',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_designations_company_name').on(table.companyId, table.name)],
);

export const work_locations = sqliteTable(
  'work_locations',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    address: text('address'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_work_locations_company_name').on(table.companyId, table.name)],
);

export const employee_expense_types = sqliteTable(
  'employee_expense_types',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    ledgerId: text('ledger_id')
      .references(() => ledgers.id)
      .notNull(),
    defaultTaxGroupId: text('default_tax_group_id').references(() => tax_groups.id),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_employee_expense_types_company_name').on(table.companyId, table.name),
  ],
);

export const leave_types = sqliteTable(
  'leave_types',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    isPaid: integer('is_paid', { mode: 'boolean' }).default(true).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_leave_types_company_name').on(table.companyId, table.name)],
);

export const holidays = sqliteTable(
  'holidays',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [uniqueIndex('idx_holidays_company_date').on(table.companyId, table.date)],
);

export type EmployeeType = typeof employee_types.$inferSelect;
export type InsertEmployeeType = typeof employee_types.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type Designation = typeof designations.$inferSelect;
export type InsertDesignation = typeof designations.$inferInsert;

export type WorkLocation = typeof work_locations.$inferSelect;
export type InsertWorkLocation = typeof work_locations.$inferInsert;

export type EmployeeExpenseType = typeof employee_expense_types.$inferSelect;
export type InsertEmployeeExpenseType = typeof employee_expense_types.$inferInsert;

export type LeaveType = typeof leave_types.$inferSelect;
export type InsertLeaveType = typeof leave_types.$inferInsert;

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

export const leave_policies = sqliteTable(
  'leave_policies',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    leaveTypeId: text('leave_type_id')
      .references(() => leave_types.id)
      .notNull(),
    employeeTypeId: text('employee_type_id')
      .references(() => employee_types.id)
      .notNull(),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),
    annualEntitlement: real('annual_entitlement').default(0).notNull(),
    maxCarryForward: real('max_carry_forward').default(0).notNull(),
    isEncashable: integer('is_encashable', { mode: 'boolean' }).default(false).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_leave_policies_unique').on(
      table.companyId,
      table.leaveTypeId,
      table.employeeTypeId,
      table.financialYearId,
    ),
  ],
);

export const weekly_off_policies = sqliteTable(
  'weekly_off_policies',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    employeeTypeId: text('employee_type_id')
      .references(() => employee_types.id)
      .notNull(),
    dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
    isHalfDay: integer('is_half_day', { mode: 'boolean' }).default(false).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_weekly_off_policies_unique').on(
      table.companyId,
      table.employeeTypeId,
      table.dayOfWeek,
    ),
  ],
);

export type LeavePolicy = typeof leave_policies.$inferSelect;
export type InsertLeavePolicy = typeof leave_policies.$inferInsert;

export type WeeklyOffPolicy = typeof weekly_off_policies.$inferSelect;
export type InsertWeeklyOffPolicy = typeof weekly_off_policies.$inferInsert;

export const salary_components = sqliteTable(
  'salary_components',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    category: text('category', { enum: ['Earning', 'Deduction'] }).notNull(),
    calculationType: text('calculation_type', { enum: ['Fixed', 'Percentage'] }).notNull(),
    calculationBase: text('calculation_base'),
    baseComponentId: text('base_component_id').references(
      (): import('drizzle-orm/sqlite-core').AnySQLiteColumn => salary_components.id,
    ),
    defaultAmount: integer('default_amount').default(0).notNull(),
    defaultPercentage: real('default_percentage'),
    displayOrder: integer('display_order').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isBasic: integer('is_basic', { mode: 'boolean' }).default(false).notNull(),
    isProrated: integer('is_prorated', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    index('idx_salary_components_company_id').on(table.companyId),
    uniqueIndex('idx_salary_components_code').on(table.companyId, table.code),
    index('idx_salary_components_display_order').on(table.companyId, table.displayOrder),
  ],
);

export type SalaryComponent = typeof salary_components.$inferSelect;
export type InsertSalaryComponent = typeof salary_components.$inferInsert;
