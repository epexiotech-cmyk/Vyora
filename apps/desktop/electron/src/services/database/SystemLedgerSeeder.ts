import { randomUUID } from 'crypto';

import {
  ledger_groups,
  ledgers,
  LedgerGroupNature,
  LedgerReferenceType,
  OpeningType,
} from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { DbTransaction } from '../../repositories/BaseRepository';

interface SystemGroupSeed {
  name: string;
  parentName: string | null;
  nature: LedgerGroupNature;
}

interface SystemLedgerSeed {
  name: string;
  groupName: string;
  referenceType: LedgerReferenceType;
  allowManualPosting: boolean;
  openingType: OpeningType;
}

const SYSTEM_GROUPS: SystemGroupSeed[] = [
  { name: 'Assets', parentName: null, nature: 'Asset' },
  { name: 'Cash In Hand', parentName: 'Assets', nature: 'Asset' },
  { name: 'Bank Accounts', parentName: 'Assets', nature: 'Asset' },
  { name: 'Accounts Receivable', parentName: 'Assets', nature: 'Asset' },
  { name: 'Sundry Debtors', parentName: 'Accounts Receivable', nature: 'Asset' },

  { name: 'Liabilities', parentName: null, nature: 'Liability' },
  { name: 'Accounts Payable', parentName: 'Liabilities', nature: 'Liability' },
  { name: 'Sundry Creditors', parentName: 'Accounts Payable', nature: 'Liability' },
  { name: 'Duties & Taxes', parentName: 'Liabilities', nature: 'Liability' },

  { name: 'Current Assets', parentName: 'Assets', nature: 'Asset' },

  { name: 'Equity', parentName: null, nature: 'Equity' },
  { name: 'Capital Account', parentName: 'Equity', nature: 'Equity' },

  { name: 'Income', parentName: null, nature: 'Income' },
  { name: 'Sales Account', parentName: 'Income', nature: 'Income' },
  { name: 'Indirect Income', parentName: 'Income', nature: 'Income' },

  { name: 'Expenses', parentName: null, nature: 'Expense' },
  { name: 'Purchase Account', parentName: 'Expenses', nature: 'Expense' },
  { name: 'Direct Expenses', parentName: 'Expenses', nature: 'Expense' },
  { name: 'Indirect Expenses', parentName: 'Expenses', nature: 'Expense' },
];

const SYSTEM_LEDGERS: SystemLedgerSeed[] = [
  {
    name: 'Cash',
    groupName: 'Cash In Hand',
    referenceType: 'SYSTEM',
    allowManualPosting: true,
    openingType: 'Dr',
  },
  {
    name: 'Sales',
    groupName: 'Sales Account',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Cr',
  },
  {
    name: 'Purchases',
    groupName: 'Purchase Account',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Dr',
  },
  {
    name: 'Round Off',
    groupName: 'Indirect Expenses',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Dr',
  },
  {
    name: 'Discount Allowed',
    groupName: 'Indirect Expenses',
    referenceType: 'SYSTEM',
    allowManualPosting: true,
    openingType: 'Dr',
  },
  {
    name: 'Discount Received',
    groupName: 'Indirect Income',
    referenceType: 'SYSTEM',
    allowManualPosting: true,
    openingType: 'Cr',
  },
  {
    name: "Owner's Equity",
    groupName: 'Capital Account',
    referenceType: 'SYSTEM',
    allowManualPosting: true,
    openingType: 'Cr',
  },
  {
    name: 'Opening Balance Adj',
    groupName: 'Capital Account',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Cr',
  },
  {
    name: 'Inventory',
    groupName: 'Current Assets',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Dr',
  },
  {
    name: 'Cost of Goods Sold (COGS)',
    groupName: 'Direct Expenses',
    referenceType: 'SYSTEM',
    allowManualPosting: false,
    openingType: 'Dr',
  },
  {
    name: 'Output CGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Cr',
  },
  {
    name: 'Output SGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Cr',
  },
  {
    name: 'Output IGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Cr',
  },
  {
    name: 'Input CGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Dr',
  },
  {
    name: 'Input SGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Dr',
  },
  {
    name: 'Input IGST',
    groupName: 'Duties & Taxes',
    referenceType: 'TAX',
    allowManualPosting: true,
    openingType: 'Dr',
  },
];

export class SystemLedgerSeeder {
  public seedSystemLedgers(companyId: string, tx: DbTransaction): void {
    const now = new Date();

    // 1. We must insert groups in topological order so parent_group_id can be resolved.
    // The SYSTEM_GROUPS array is already ordered correctly (parents before children).

    // We will build a map of { groupName: databaseId } as we insert.
    const groupNameIdMap = new Map<string, string>();

    for (const group of SYSTEM_GROUPS) {
      const parentId = group.parentName ? groupNameIdMap.get(group.parentName) || null : null;

      // Upsert using ON CONFLICT DO NOTHING
      const id = randomUUID();
      tx.insert(ledger_groups)
        .values({
          id,
          companyId,
          name: group.name,
          parentGroupId: parentId,
          nature: group.nature,
          isSystemGroup: true,
          isActive: true,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: [ledger_groups.companyId, ledger_groups.name] })
        .run();

      // Because ON CONFLICT DO NOTHING doesn't return the ID if it already existed,
      // we MUST query it definitively to get the true database ID for subsequent relationships.
      const existing = tx
        .select({ id: ledger_groups.id })
        .from(ledger_groups)
        .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, group.name)))
        .get();

      if (!existing) {
        throw new Error(
          `Critical failure: System group ${group.name} could not be inserted or resolved.`,
        );
      }

      groupNameIdMap.set(group.name, existing.id);
    }

    // 2. Insert ledgers using the resolved group IDs
    for (const ledger of SYSTEM_LEDGERS) {
      const groupId = groupNameIdMap.get(ledger.groupName);
      if (!groupId) {
        throw new Error(
          `Critical failure: Ledger group ${ledger.groupName} missing during ledger seeding.`,
        );
      }

      const id = randomUUID();
      tx.insert(ledgers)
        .values({
          id,
          companyId,
          groupId,
          name: ledger.name,
          referenceType: ledger.referenceType,
          isSystemAccount: true,
          allowManualPosting: ledger.allowManualPosting,
          openingType: ledger.openingType,
          openingBalance: 0,
          isFrozen: false,
          isActive: true,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: [ledgers.companyId, ledgers.groupId, ledgers.name] })
        .run();
    }
  }
}

export const systemLedgerSeeder = new SystemLedgerSeeder();
