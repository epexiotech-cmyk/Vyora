import * as path from 'path';

import type { VyoraDatabase } from '@vyora/database';
import { companies, expense_presets, ledger_groups, ledgers } from '@vyora/database';
import * as schema from '@vyora/database';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { companyBootstrapService } from '../../src/services/CompanyBootstrapService';
import { dbService } from '../../src/services/database/DatabaseService';
import { systemExpensePresetSeeder } from '../../src/services/database/SystemExpensePresetSeeder';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

describe('SystemExpensePresetSeeder', () => {
  let db: VyoraDatabase;

  beforeEach(() => {
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, {
      schema: schema as unknown as Record<string, unknown>,
    }) as unknown as VyoraDatabase;

    vi.spyOn(dbService, 'getDb').mockReturnValue(db);

    migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../../../../packages/database/drizzle'),
    });
  });

  const setupBaseCompany = async (): Promise<string> => {
    const companyId = await companyBootstrapService.createCompany({
      legalName: 'Seeder Test Company',
      currency: 'INR',
      financialYearStart: new Date('2026-04-01'),
      isGstRegistered: false,
    });
    return companyId;
  };

  it('1. First seed / Idempotency - seeds 20 defaults and running twice produces no duplicates', async () => {
    const companyId = await setupBaseCompany();

    // After company bootstrap, the seeder has already run once!
    // But let's run it again to test idempotency directly.
    dbService.getDb().transaction((tx) => {
      systemExpensePresetSeeder.seedExpensePresets(companyId, tx);
    });

    const presets = db
      .select()
      .from(expense_presets)
      .where(eq(expense_presets.companyId, companyId))
      .all();

    expect(presets.length).toBe(20);

    const presetNames = presets.map((p) => p.name);
    expect(presetNames).toContain('Office Rent');
    expect(presetNames).toContain('Miscellaneous Expenses');
    expect(presetNames).toContain('Salaries & Wages');

    // All must be system presets
    presets.forEach((p) => {
      expect(p.isSystem).toBe(true);
    });

    // Run again
    dbService.getDb().transaction((tx) => {
      systemExpensePresetSeeder.seedExpensePresets(companyId, tx);
    });

    const presetsAfterSecondRun = db
      .select()
      .from(expense_presets)
      .where(eq(expense_presets.companyId, companyId))
      .all();

    expect(presetsAfterSecondRun.length).toBe(20);
  });

  it('2. Ledger reuse - does not create duplicate ledger if it exists', async () => {
    const companyId = await setupBaseCompany();

    // Find the 'Travel' ledger
    const travelLedgers = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Travel')))
      .all();

    expect(travelLedgers.length).toBe(1);
    expect(travelLedgers[0].referenceType).toBe('SYSTEM');
  });

  it('3. User preset preservation - does not overwrite existing user preset', async () => {
    // For this test, we must bypass createCompany's internal seeder to test it in isolation
    // Setup a manual company
    const companyId = 'test-co-isolation';
    const groupId = 'test-group-id';
    dbService.getDb().transaction((tx) => {
      tx.insert(companies)
        .values({
          id: companyId,
          legalName: 'Manual Company',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();

      tx.insert(ledger_groups)
        .values({
          id: groupId,
          companyId,
          name: 'Indirect Expenses',
          nature: 'Expense',
          syncVersion: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();

      // Create a manual ledger and preset for 'Office Rent'
      const customLedgerId = 'custom-ledger-123';
      tx.insert(ledgers)
        .values({
          id: customLedgerId,
          companyId,
          groupId,
          name: 'Custom Office Rent Ledger',
          referenceType: 'MANUAL',
          isSystemAccount: false,
          allowManualPosting: true,
          openingType: 'Dr',
          openingBalance: 0,
          isFrozen: false,
          isActive: true,
          syncVersion: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();

      tx.insert(expense_presets)
        .values({
          id: 'user-preset-id',
          companyId,
          name: 'Office Rent', // Same name as candidate
          ledgerId: customLedgerId,
          defaultTaxGroupId: null,
          isActive: true,
          isSystem: false, // User created
          syncVersion: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();
    });

    // Run reconciliation
    dbService.getDb().transaction((tx) => {
      systemExpensePresetSeeder.seedExpensePresets(companyId, tx);
    });

    const officeRentPresets = db
      .select()
      .from(expense_presets)
      .where(and(eq(expense_presets.companyId, companyId), eq(expense_presets.name, 'Office Rent')))
      .all();

    expect(officeRentPresets.length).toBe(1);
    expect(officeRentPresets[0].isSystem).toBe(false); // User preset preserved
    expect(officeRentPresets[0].ledgerId).toBe('custom-ledger-123'); // Custom mapping preserved

    // Check that we didn't orphan a ledger named 'Office Rent'
    const officeRentLedgers = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Office Rent')))
      .all();
    expect(officeRentLedgers.length).toBe(0); // Should be 0 since preset existed
  });
});
