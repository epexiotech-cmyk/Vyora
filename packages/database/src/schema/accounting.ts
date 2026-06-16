import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

import { companies, financial_years } from './system';

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export const LedgerGroupNatureEnum = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'] as const;
export type LedgerGroupNature = (typeof LedgerGroupNatureEnum)[number];

export const LedgerReferenceTypeEnum = [
  'CUSTOMER',
  'SUPPLIER',
  'BANK',
  'TAX',
  'SYSTEM',
  'MANUAL',
] as const;
export type LedgerReferenceType = (typeof LedgerReferenceTypeEnum)[number];

export const OpeningTypeEnum = ['Dr', 'Cr'] as const;
export type OpeningType = (typeof OpeningTypeEnum)[number];

export const VoucherTypeEnum = [
  'Sales',
  'Purchase',
  'Receipt',
  'Payment',
  'Contra',
  'Journal',
  'CreditNote',
  'DebitNote',
] as const;
export type VoucherType = (typeof VoucherTypeEnum)[number];

export const VoucherReferenceTypeEnum = [
  'SALES_INVOICE',
  'SALES_INVOICE_CANCELLATION',
  'PURCHASE_BILL',
  'PURCHASE_BILL_CANCELLATION',
  'PAYMENT',
  'RECEIPT',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'MANUAL',
] as const;
export type VoucherReferenceType = (typeof VoucherReferenceTypeEnum)[number];
// -----------------------------------------------------------------------------
// SETTLEMENT ENUMS
// -----------------------------------------------------------------------------

export const SettlementTypeEnum = ['RECEIPT', 'PAYMENT'] as const;
export type SettlementType = (typeof SettlementTypeEnum)[number];

export const SettlementPartyTypeEnum = ['CUSTOMER', 'SUPPLIER'] as const;
export type SettlementPartyType = (typeof SettlementPartyTypeEnum)[number];

export const AllocationDocumentTypeEnum = [
  'SALES_INVOICE',
  'PURCHASE_BILL',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'OPENING_BALANCE',
] as const;
export type AllocationDocumentType = (typeof AllocationDocumentTypeEnum)[number];

export const SettlementStatusEnum = ['DRAFT', 'COMPLETED', 'CANCELLED'] as const;
export type SettlementStatus = (typeof SettlementStatusEnum)[number];
// -----------------------------------------------------------------------------
// TABLES
// -----------------------------------------------------------------------------

export const ledger_groups = sqliteTable(
  'ledger_groups',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    name: text('name').notNull(),
    parentGroupId: text('parent_group_id').references((): AnySQLiteColumn => ledger_groups.id),
    nature: text('nature', { enum: LedgerGroupNatureEnum }).notNull(),
    isSystemGroup: integer('is_system_group', { mode: 'boolean' }).default(false).notNull(),

    // Audit & Sync
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_ledger_groups_company_name').on(table.companyId, table.name),
    index('idx_ledger_groups_company_parent').on(table.companyId, table.parentGroupId),
  ],
);

export const ledgers = sqliteTable(
  'ledgers',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    branchId: text('branch_id'),
    groupId: text('group_id')
      .references(() => ledger_groups.id)
      .notNull(),

    name: text('name').notNull(),
    referenceType: text('reference_type', { enum: LedgerReferenceTypeEnum }).notNull(),
    referenceId: text('reference_id'),

    isSystemAccount: integer('is_system_account', { mode: 'boolean' }).default(false).notNull(),
    allowManualPosting: integer('allow_manual_posting', { mode: 'boolean' })
      .default(true)
      .notNull(),
    isFrozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

    // Opening Balances (stored in paise)
    openingBalance: integer('opening_balance').default(0).notNull(),
    openingType: text('opening_type', { enum: OpeningTypeEnum }).notNull(),

    // Audit & Sync
    notes: text('notes'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_ledgers_company_group_name').on(table.companyId, table.groupId, table.name),
    uniqueIndex('idx_ledgers_company_reference').on(
      table.companyId,
      table.referenceType,
      table.referenceId,
    ),
    index('idx_ledgers_company_group').on(table.companyId, table.groupId),
  ],
);

export const vouchers = sqliteTable(
  'vouchers',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    branchId: text('branch_id'),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),

    voucherType: text('voucher_type', { enum: VoucherTypeEnum }).notNull(),
    voucherNumber: text('voucher_number').notNull(),
    voucherDate: integer('voucher_date', { mode: 'timestamp' }).notNull(),

    sourceModule: text('source_module').notNull(),
    referenceType: text('reference_type', { enum: VoucherReferenceTypeEnum }).notNull(),
    referenceId: text('reference_id'),
    reversalVoucherId: text('reversal_voucher_id').references((): AnySQLiteColumn => vouchers.id),

    narration: text('narration'),
    isCancelled: integer('is_cancelled', { mode: 'boolean' }).default(false).notNull(),
    isFrozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

    // Audit & Sync
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_vouchers_unique').on(
      table.companyId,
      table.financialYearId,
      table.voucherType,
      table.voucherNumber,
    ),
    uniqueIndex('idx_vouchers_company_reference_unique').on(
      table.companyId,
      table.referenceType,
      table.referenceId,
    ),
    index('idx_vouchers_company_date').on(table.companyId, table.voucherDate),
  ],
);

export const voucher_entries = sqliteTable(
  'voucher_entries',
  {
    id: text('id').primaryKey(),
    voucherId: text('voucher_id')
      .references(() => vouchers.id)
      .notNull(),
    lineNumber: integer('line_number').notNull(),
    ledgerId: text('ledger_id')
      .references(() => ledgers.id)
      .notNull(),

    // Amounts stored in paise
    debitAmount: integer('debit_amount').default(0).notNull(),
    creditAmount: integer('credit_amount').default(0).notNull(),

    entryDate: integer('entry_date', { mode: 'timestamp' }).notNull(),
    narration: text('narration'),

    // Audit & Sync
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_voucher_entries_voucher').on(table.voucherId),
    index('idx_voucher_entries_ledger').on(table.ledgerId),
  ],
);

export const settlements = sqliteTable(
  'settlements',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    branchId: text('branch_id'),
    financialYearId: text('financial_year_id')
      .references(() => financial_years.id)
      .notNull(),

    settlementType: text('settlement_type', { enum: SettlementTypeEnum }).notNull(),
    partyType: text('party_type', { enum: SettlementPartyTypeEnum }).notNull(),
    partyId: text('party_id').notNull(),

    settlementNumber: text('settlement_number').notNull(),
    settlementDate: integer('settlement_date', { mode: 'timestamp' }).notNull(),

    amount: integer('amount').default(0).notNull(),
    allocatedAmount: integer('allocated_amount').default(0).notNull(),
    unallocatedAmount: integer('unallocated_amount').default(0).notNull(),

    paymentMode: text('payment_mode').notNull(),
    bankLedgerId: text('bank_ledger_id')
      .references(() => ledgers.id)
      .notNull(),

    referenceNumber: text('reference_number'),
    referenceDate: integer('reference_date', { mode: 'timestamp' }),

    notes: text('notes'),
    status: text('status', { enum: SettlementStatusEnum }).notNull(),
    isFrozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

    // Audit & Sync
    syncVersion: integer('sync_version').default(1).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('idx_settlements_unique').on(
      table.companyId,
      table.financialYearId,
      table.settlementType,
      table.settlementNumber,
    ),
    index('idx_settlements_company_party_status').on(table.companyId, table.partyId, table.status),
    index('idx_settlements_company_date').on(table.companyId, table.settlementDate),
  ],
);

export const settlement_allocations = sqliteTable(
  'settlement_allocations',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    settlementId: text('settlement_id')
      .references(() => settlements.id)
      .notNull(),

    documentType: text('document_type', { enum: AllocationDocumentTypeEnum }).notNull(),
    documentId: text('document_id').notNull(),

    allocatedAmount: integer('allocated_amount').default(0).notNull(),
    allocationDate: integer('allocation_date', { mode: 'timestamp' }).notNull(),

    // Audit & Sync
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_settlement_allocations_unique').on(
      table.companyId,
      table.settlementId,
      table.documentType,
      table.documentId,
    ),
    index('idx_settlement_allocations_company_doc').on(
      table.companyId,
      table.documentType,
      table.documentId,
    ),
  ],
);

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type LedgerGroup = typeof ledger_groups.$inferSelect;
export type InsertLedgerGroup = typeof ledger_groups.$inferInsert;

export type Ledger = typeof ledgers.$inferSelect;
export type InsertLedger = typeof ledgers.$inferInsert;

export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = typeof vouchers.$inferInsert;

export type VoucherEntry = typeof voucher_entries.$inferSelect;
export type InsertVoucherEntry = typeof voucher_entries.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = typeof settlements.$inferInsert;

export type SettlementAllocation = typeof settlement_allocations.$inferSelect;
export type InsertSettlementAllocation = typeof settlement_allocations.$inferInsert;
