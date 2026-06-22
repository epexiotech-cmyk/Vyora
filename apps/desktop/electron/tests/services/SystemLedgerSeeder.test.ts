import { randomUUID } from 'crypto';
/* eslint-disable */
import * as path from 'path';

import { ledger_groups, ledgers } from '@vyora/database';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, beforeEach } from 'vitest';

import { systemLedgerSeeder } from '../../src/services/database/SystemLedgerSeeder';

describe('Phase 7.1.2E: SystemLedgerSeeder Rehearsal Validation', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;

  beforeEach(() => {
    // A fresh in-memory database for each scenario ensures absolute isolation
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Apply exact production migrations to the disposable memory instance
    migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../../../../packages/database/drizzle'),
    });

    companyId = randomUUID();
  });

  it('Scenario A: Fresh Company Rehearsal', async () => {
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    const groups = db
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.companyId, companyId))
      .all();
    const accounts = db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all();

    expect(groups.length).toBe(18);
    expect(accounts.length).toBe(7);

    // Verify parent-child relationship (Assets -> Cash In Hand)
    const assets = groups.find((g) => g.name === 'Assets');
    const cashGroup = groups.find((g) => g.name === 'Cash In Hand');
    expect(cashGroup?.parentGroupId).toBe(assets?.id);
  });

  it('Scenario B: Re-Run Validation', async () => {
    // First run
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    // Second run
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    const groups = db
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.companyId, companyId))
      .all();
    const accounts = db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all();

    expect(groups.length).toBe(18);
    expect(accounts.length).toBe(7);
  });

  it('Scenario C: Missing System Ledger Recovery', async () => {
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    // Remove one ledger (Sales)
    const salesLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sales')))
      .get();
    db.delete(ledgers).where(eq(ledgers.id, salesLedger!.id)).run();

    expect(db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all().length).toBe(6);

    // Re-run
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    expect(db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all().length).toBe(7);
  });

  it('Scenario D: Custom Ledger Protection', async () => {
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    const expenseGroup = db
      .select()
      .from(ledger_groups)
      .where(
        and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Indirect Expenses')),
      )
      .get();

    // Insert custom ledger
    db.insert(ledgers)
      .values({
        id: randomUUID(),
        companyId,
        groupId: expenseGroup!.id,
        name: 'Tea & Snacks',
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

    // Re-run
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    const allLedgers = db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all();
    const customLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Tea & Snacks')))
      .get();

    expect(allLedgers.length).toBe(8); // 7 system + 1 custom
    expect(customLedger).toBeDefined();
  });

  it('Scenario E: Governance Verification', async () => {
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
    });

    const equityGroup = db
      .select()
      .from(ledger_groups)
      .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Capital Account')))
      .get();
    const ownersEquity = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, "Owner's Equity")))
      .get();
    const salesLedger = db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.companyId, companyId), eq(ledgers.name, 'Sales')))
      .get();

    expect(equityGroup?.nature).toBe('Equity');
    expect(equityGroup?.isSystemGroup).toBe(true);

    expect(ownersEquity?.allowManualPosting).toBe(true);
    expect(ownersEquity?.isSystemAccount).toBe(true);

    expect(salesLedger?.allowManualPosting).toBe(false);
  });

  it('Scenario F: Transaction Safety (Forced Rollback)', async () => {
    try {
      await db.transaction(async (tx) => {
        await systemLedgerSeeder.seedSystemLedgers(companyId, tx as any);
        throw new Error('Forced failure to trigger rollback');
      });
    } catch (err) {
      // Expected
    }

    const groups = db
      .select()
      .from(ledger_groups)
      .where(eq(ledger_groups.companyId, companyId))
      .all();
    const accounts = db.select().from(ledgers).where(eq(ledgers.companyId, companyId)).all();

    expect(groups.length).toBe(0);
    expect(accounts.length).toBe(0);
  });
});
