import { randomUUID } from 'crypto';
import * as path from 'path';

import {
  ledger_groups,
  ledgers,
  payment_accounts,
  vouchers,
  companies,
  financial_years,
} from '@vyora/database';
import * as schema from '@vyora/database';
import { CreateOpeningBalanceInput } from '@vyora/types';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

import { companyContextService } from '../../src/services/CompanyContextService';
import { dbService } from '../../src/services/database/DatabaseService';
import { systemLedgerSeeder } from '../../src/services/database/SystemLedgerSeeder';
import { documentNumberingService } from '../../src/services/DocumentNumberingService';
import { financialYearContextService } from '../../src/services/FinancialYearContextService';
import { paymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';

describe('PaymentAccountOpeningBalanceService', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;
  let fyId: string;
  let paymentAccountId: string;

  beforeEach(async () => {
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

    // 1. Setup Company & FY
    db.insert(companies)
      .values({
        id: companyId,
        legalName: 'Test Company',
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

    // 2. Mock Contexts
    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue(companyId);
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      companyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: true,
    });
    vi.spyOn(documentNumberingService, 'generateNextNumberSync').mockResolvedValue('JRN-001');

    // 3. Seed System Ledgers
    await db.transaction(async (tx) => {
      await systemLedgerSeeder.seedSystemLedgers(
        companyId,
        tx as import('../../src/repositories/BaseRepository').DbTransaction,
      );
    });

    // 4. Create Payment Account
    paymentAccountId = randomUUID();
    const ledgerId = randomUUID();
    const bankGroup = db
      .select()
      .from(ledger_groups)
      .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, 'Bank Accounts')))
      .get();

    db.insert(ledgers)
      .values({
        id: ledgerId,
        companyId,
        groupId: bankGroup!.id,
        name: 'HDFC Bank',
        referenceType: 'BANK',
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

    db.insert(payment_accounts)
      .values({
        id: paymentAccountId,
        companyId,
        ledgerId,
        displayName: 'HDFC Bank',
        accountType: 'BANK',
        isActive: true,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 — Valid date inside FY', async () => {
    const input: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 50000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-06-15'), // Inside 2026-04-01 -> 2027-03-31
      notes: 'Initial Balance',
    };

    const { voucherId } = await paymentAccountOpeningBalanceService.createOpeningBalance(input);

    const voucher = db.select().from(vouchers).where(eq(vouchers.id, voucherId)).get();
    expect(voucher).toBeDefined();
    expect(voucher?.voucherType).toBe('OPENING_BALANCE');
    expect(voucher?.referenceType).toBe('PAYMENT_ACCOUNT_OPENING');
  });

  it('Test 2 — Date before FY', async () => {
    const input: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 50000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-03-31'), // Before FY 2026
    };

    await expect(paymentAccountOpeningBalanceService.createOpeningBalance(input)).rejects.toThrow(
      'ERR_INVALID_DATE',
    );
  });

  it('Test 3 — Date after FY', async () => {
    const input: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 50000,
      balanceType: 'Dr',
      voucherDate: new Date('2027-04-01'), // After FY 2026
    };

    await expect(paymentAccountOpeningBalanceService.createOpeningBalance(input)).rejects.toThrow(
      'ERR_INVALID_DATE',
    );
  });

  it('Test 4 — Cross-FY duplicate', async () => {
    // 1. Create in FY 2026
    const input1: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 50000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    };
    await paymentAccountOpeningBalanceService.createOpeningBalance(input1);

    // 2. Switch to FY 2027 context
    const fy2027Id = randomUUID();
    db.insert(financial_years)
      .values({
        id: fy2027Id,
        companyId,
        label: 'FY 2027',
        startDate: new Date('2027-04-01'),
        endDate: new Date('2028-03-31'),
        isActive: true,
      })
      .run();

    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fy2027Id,
      companyId,
      label: 'FY 2027',
      startDate: new Date('2027-04-01'),
      endDate: new Date('2028-03-31'),
      isActive: true,
    });

    // 3. Attempt to create again
    const input2: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 75000,
      balanceType: 'Dr',
      voucherDate: new Date('2027-04-05'),
    };
    await expect(paymentAccountOpeningBalanceService.createOpeningBalance(input2)).rejects.toThrow(
      'An opening balance already exists',
    );
  });

  it('Test 5 — Edit existing opening balance', async () => {
    const input1: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 10000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    };
    const { voucherId: id1 } =
      await paymentAccountOpeningBalanceService.createOpeningBalance(input1);

    const input2: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 15000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    };
    const { voucherId: id2 } =
      await paymentAccountOpeningBalanceService.updateOpeningBalance(input2);

    // Old voucher cancelled
    const oldVoucher = db.select().from(vouchers).where(eq(vouchers.id, id1)).get();
    expect(oldVoucher?.isCancelled).toBe(true);

    // Reversal voucher exists
    const reversal = db.select().from(vouchers).where(eq(vouchers.referenceId, id1)).get();
    expect(reversal).toBeDefined();
    expect(reversal?.voucherType).toBe('Journal');
    expect(reversal?.isCancelled).toBe(false);

    // New voucher active
    const newVoucher = db.select().from(vouchers).where(eq(vouchers.id, id2)).get();
    expect(newVoucher?.isCancelled).toBe(false);
    expect(newVoucher?.voucherType).toBe('OPENING_BALANCE');

    // Only one active OPENING_BALANCE voucher
    const activeOpeningVouchers = db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.referenceId, paymentAccountId),
          eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
          eq(vouchers.voucherType, 'OPENING_BALANCE'),
          eq(vouchers.isCancelled, false),
        ),
      )
      .all();
    expect(activeOpeningVouchers.length).toBe(1);
    expect(activeOpeningVouchers[0].id).toBe(id2);
  });

  it('Test 6 — Edit to zero', async () => {
    const input1: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 10000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    };
    const { voucherId: id1 } =
      await paymentAccountOpeningBalanceService.createOpeningBalance(input1);

    // "Edit to zero" triggers reverseOpeningBalance from the IPC handler
    paymentAccountOpeningBalanceService.reverseOpeningBalance(paymentAccountId);

    const oldVoucher = db.select().from(vouchers).where(eq(vouchers.id, id1)).get();
    expect(oldVoucher?.isCancelled).toBe(true);

    const activeOpeningVouchers = db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.referenceId, paymentAccountId),
          eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
          eq(vouchers.voucherType, 'OPENING_BALANCE'),
          eq(vouchers.isCancelled, false),
        ),
      )
      .all();
    expect(activeOpeningVouchers.length).toBe(0); // No active opening vouchers left
  });

  it('Test 7 — Cancelled historical opening voucher does not block', async () => {
    const input1: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 10000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    };
    await paymentAccountOpeningBalanceService.createOpeningBalance(input1);

    // Cancel it manually to simulate a historical state
    paymentAccountOpeningBalanceService.reverseOpeningBalance(paymentAccountId);

    // Now try to create a new one (it should succeed)
    const input2: CreateOpeningBalanceInput = {
      paymentAccountId,
      amount: 25000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-05'),
    };
    const { voucherId } = await paymentAccountOpeningBalanceService.createOpeningBalance(input2);
    expect(voucherId).toBeDefined();
  });
});
