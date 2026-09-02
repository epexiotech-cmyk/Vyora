import { randomUUID } from 'crypto';

import { expense_presets, ledgers, ledger_groups } from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { DbTransaction } from '../../repositories/BaseRepository';

const DEFAULT_EXPENSE_PRESETS = [
  'Office Rent',
  'Electricity',
  'Internet & Telephone',
  'Salaries & Wages',
  'Staff Welfare',
  'Travel',
  'Conveyance',
  'Fuel & Vehicle Expenses',
  'Printing & Stationery',
  'Office Supplies',
  'Repairs & Maintenance',
  'Professional Fees',
  'Bank Charges',
  'Insurance',
  'Advertising & Marketing',
  'Postage & Courier',
  'Software & Subscriptions',
  'Cleaning & Housekeeping',
  'Security Expenses',
  'Miscellaneous Expenses',
];

export class SystemExpensePresetSeeder {
  public seedExpensePresets(companyId: string, tx: DbTransaction): void {
    const now = new Date();

    // 1. Get the 'Indirect Expenses' group ID
    const indirectExpensesGroup = tx
      .select({ id: ledger_groups.id })
      .from(ledger_groups)
      .where(
        and(
          eq(ledger_groups.companyId, companyId),
          eq(ledger_groups.name, 'Indirect Expenses'),
          eq(ledger_groups.nature, 'Expense'),
        ),
      )
      .get();

    if (!indirectExpensesGroup) {
      // Skip reconciliation if we cannot resolve the correct accounting group
      return;
    }

    const groupId = indirectExpensesGroup.id;

    for (const presetName of DEFAULT_EXPENSE_PRESETS) {
      // 1. Check if the preset already exists (user or system)
      const existingPreset = tx
        .select({ id: expense_presets.id })
        .from(expense_presets)
        .where(and(eq(expense_presets.companyId, companyId), eq(expense_presets.name, presetName)))
        .get();

      if (existingPreset) {
        // Leave existing preset untouched
        continue;
      }

      // 2. Check if ledger already exists under "Indirect Expenses"
      let ledger = tx
        .select({ id: ledgers.id })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.companyId, companyId),
            eq(ledgers.name, presetName),
            eq(ledgers.groupId, groupId),
          ),
        )
        .get();

      // 3. If not, create the ledger
      if (!ledger) {
        const ledgerId = randomUUID();
        tx.insert(ledgers)
          .values({
            id: ledgerId,
            companyId,
            groupId,
            name: presetName,
            referenceType: 'SYSTEM',
            isSystemAccount: false,
            allowManualPosting: true,
            openingType: 'Dr',
            openingBalance: 0,
            isFrozen: false,
            isActive: true,
            syncVersion: 1,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing({ target: [ledgers.companyId, ledgers.groupId, ledgers.name] })
          .run();

        // Retrieve the ledger
        ledger = tx
          .select({ id: ledgers.id })
          .from(ledgers)
          .where(
            and(
              eq(ledgers.companyId, companyId),
              eq(ledgers.name, presetName),
              eq(ledgers.groupId, groupId),
            ),
          )
          .get();
      }

      if (!ledger) {
        throw new Error(`Failed to resolve ledger for ${presetName}`);
      }

      // 4. Create the preset mapped to this ledger
      tx.insert(expense_presets)
        .values({
          id: randomUUID(),
          companyId,
          name: presetName,
          ledgerId: ledger.id,
          defaultTaxGroupId: null,
          isActive: true,
          isSystem: true,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: [expense_presets.companyId, expense_presets.name] })
        .run();
    }
  }
}

export const systemExpensePresetSeeder = new SystemExpensePresetSeeder();
