import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { ledgers } from './accounting';
import { companies } from './system';

export const PaymentAccountTypeEnum = ['BANK', 'CASH', 'UPI', 'POS'] as const;
export type PaymentAccountType = (typeof PaymentAccountTypeEnum)[number];

export const payment_accounts = sqliteTable(
  'payment_accounts',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .references(() => companies.id)
      .notNull(),
    ledgerId: text('ledger_id')
      .references(() => ledgers.id)
      .notNull(),

    accountType: text('account_type', { enum: PaymentAccountTypeEnum }).notNull(),

    // Display info
    displayName: text('display_name').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),

    // Bank details
    bankName: text('bank_name'),
    accountHolderName: text('account_holder_name'),
    accountNumber: text('account_number'),
    ifscCode: text('ifsc_code'),
    branchName: text('branch_name'),

    // UPI/POS details
    upiId: text('upi_id'),
    merchantName: text('merchant_name'),
    qrEnabled: integer('qr_enabled', { mode: 'boolean' }).default(false).notNull(),

    // State
    isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    notes: text('notes'),

    // Audit & Sync
    syncVersion: integer('sync_version').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => [
    // Unique constraints will be enforced at the application layer as well,
    // but these indexes speed up the checks.
    index('idx_payment_accounts_company').on(table.companyId),
    index('idx_payment_accounts_type').on(table.companyId, table.accountType),
    index('idx_payment_accounts_ledger').on(table.ledgerId),
    uniqueIndex('idx_payment_accounts_ledger_unique').on(table.companyId, table.ledgerId),
    uniqueIndex('idx_payment_accounts_acc_num_unique').on(table.companyId, table.accountNumber),
    uniqueIndex('idx_payment_accounts_upi_unique').on(table.companyId, table.upiId),
  ],
);

export type PaymentAccount = typeof payment_accounts.$inferSelect;
export type InsertPaymentAccount = typeof payment_accounts.$inferInsert;
