import { randomUUID } from 'crypto';
import * as path from 'path';

import {
  companies,
  financial_years,
  ledgers,
  vouchers,
  voucher_entries,
  VoucherReferenceType,
} from '@vyora/database';
import * as schema from '@vyora/database';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest';

import { DbTransaction } from '../../src/repositories/BaseRepository';
import { companyContextService } from '../../src/services/CompanyContextService';
import { dbService } from '../../src/services/database/DatabaseService';
import { systemLedgerSeeder } from '../../src/services/database/SystemLedgerSeeder';
import { financialYearContextService } from '../../src/services/FinancialYearContextService';
import { paymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';
import {
  PaymentAccountDeletionError,
  paymentAccountService,
} from '../../src/services/PaymentAccountService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

describe('Payment Account Deletion Regression Suite', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;
  let fyId: string;

  beforeAll(async () => {
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, {
      schema: schema as unknown as Record<string, unknown>,
    }) as unknown as ReturnType<typeof drizzle>;
    vi.spyOn(dbService, 'getDb').mockReturnValue(
      db as unknown as ReturnType<typeof dbService.getDb>,
    );

    migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../../../../packages/database/drizzle'),
    });

    companyId = randomUUID();
    fyId = randomUUID();

    db.insert(companies)
      .values({
        id: companyId,
        legalName: 'E2E Testing Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(financial_years)
      .values({
        id: fyId,
        companyId,
        label: 'FY 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
      })
      .run();

    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      companyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    });

    systemLedgerSeeder.seedSystemLedgers(companyId, db as unknown as DbTransaction);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      companyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    });
  });

  const insertNormalTransaction = (
    ledgerId: string,
    refType: VoucherReferenceType | null = 'MANUAL',
  ) => {
    const voucherId = randomUUID();
    db.insert(vouchers)
      .values({
        id: voucherId,
        companyId,
        financialYearId: fyId,
        voucherType: 'Journal',
        voucherNumber: randomUUID().slice(0, 8),
        voucherDate: new Date(),
        sourceModule: 'JOURNAL',
        referenceType: refType as VoucherReferenceType,
        isCancelled: false,
        isFrozen: false,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(voucher_entries)
      .values({
        id: randomUUID(),
        voucherId,
        lineNumber: 1,
        ledgerId,
        debitAmount: 1000,
        creditAmount: 0,
        entryDate: new Date(),
        syncVersion: 1,
        createdAt: new Date(),
      })
      .run();
  };

  it('TEST A: Account with NO ledger entries', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank A',
      isActive: true,
    });

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(true);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(false);

    paymentAccountService.delete(account.id);

    const existsAfter = await paymentAccountService.getById(account.id);
    expect(existsAfter).toBeNull();
  });

  it('TEST B: Account with ONLY Opening Balance', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank B',
      isActive: true,
    });

    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: account.id,
      amount: 1000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(true);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(false);

    paymentAccountService.delete(account.id);

    const existsAfter = await paymentAccountService.getById(account.id);
    expect(existsAfter).toBeNull();
  });

  it('TEST C: Account with Opening Balance + ONE normal ledger transaction', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank C',
      isActive: true,
    });

    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: account.id,
      amount: 1000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    insertNormalTransaction(account.ledgerId);

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(false);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(true);

    expect(() => {
      paymentAccountService.delete(account.id);
    }).toThrowError(PaymentAccountDeletionError);

    const existsAfter = await paymentAccountService.getById(account.id);
    expect(existsAfter).not.toBeNull();
  });

  it('TEST D: Account with normal ledger transaction but NO Opening Balance', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank D',
      isActive: true,
    });

    insertNormalTransaction(account.ledgerId);

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(false);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(true);

    expect(() => {
      paymentAccountService.delete(account.id);
    }).toThrowError(PaymentAccountDeletionError);

    const existsAfter = await paymentAccountService.getById(account.id);
    expect(existsAfter).not.toBeNull();
  });

  it('TEST E: Inactive account with ONLY Opening Balance', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank E',
      isActive: false,
    });

    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: account.id,
      amount: 1000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(true);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(false);
    expect(accBefore?.capabilities?.canActivate).toBe(true);
  });

  it('TEST F: Inactive account with non-opening ledger entries', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank F',
      isActive: false,
    });

    insertNormalTransaction(account.ledgerId);

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(false);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(true);
    expect(accBefore?.capabilities?.canActivate).toBe(true);
  });

  it('TEST G: HDFC regression already-soft-deleted ledger', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank G',
      isActive: true,
    });

    db.update(ledgers).set({ deletedAt: new Date() }).where(eq(ledgers.id, account.ledgerId)).run();

    paymentAccountService.delete(account.id);

    const existsAfter = await paymentAccountService.getById(account.id);
    expect(existsAfter).toBeNull();
  });

  it('TEST H: Normal voucher whose referenceType is NULL', async () => {
    const account = await paymentAccountService.create({
      accountType: 'BANK',
      displayOrder: 1,
      displayName: 'Bank H',
      isActive: true,
    });

    insertNormalTransaction(account.ledgerId, null);

    const searchResultsBefore = await paymentAccountService.search({});
    const accBefore = searchResultsBefore.find((a) => a.id === account.id);
    expect(accBefore?.capabilities?.canDelete).toBe(false);
    expect(accBefore?.capabilities?.hasNonOpeningLedgerEntries).toBe(true);

    expect(() => {
      paymentAccountService.delete(account.id);
    }).toThrowError(PaymentAccountDeletionError);
  });
});
