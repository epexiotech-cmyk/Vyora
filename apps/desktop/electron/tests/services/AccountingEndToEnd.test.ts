import { randomUUID } from 'crypto';
import * as path from 'path';

import { companies, financial_years, vouchers, voucher_entries } from '@vyora/database';
import * as schema from '@vyora/database';
import { FundTransferDto, PaymentAccountDto } from '@vyora/types';
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
import { fundTransferService } from '../../src/services/FundTransferService';
import { generalLedgerService } from '../../src/services/GeneralLedgerService';
import { paymentAccountOpeningBalanceService } from '../../src/services/PaymentAccountOpeningBalanceService';
import { paymentAccountService } from '../../src/services/PaymentAccountService';
import { trialBalanceService } from '../../src/services/TrialBalanceService';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('') },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
}));

describe('Accounting End-to-End Verification Suite', () => {
  let db: ReturnType<typeof drizzle>;
  let companyId: string;
  let fyId: string;

  let hdfcBank: PaymentAccountDto;
  let sbiBank: PaymentAccountDto;
  let cashAccount: PaymentAccountDto;
  let phonePeUpi: PaymentAccountDto;

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

  it('1. Create Payment Accounts and Assign Opening Balances', async () => {
    hdfcBank = await paymentAccountService.create({
      accountType: 'BANK',
      displayName: 'HDFC Bank',
      accountNumber: '1111',
      qrEnabled: false,
      isDefault: true,
      isActive: true,
      displayOrder: 1,
    });
    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: hdfcBank.id,
      amount: 100000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    sbiBank = await paymentAccountService.create({
      accountType: 'BANK',
      displayName: 'SBI Bank',
      accountNumber: '2222',
      qrEnabled: false,
      isDefault: false,
      isActive: true,
      displayOrder: 2,
    });
    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: sbiBank.id,
      amount: 50000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    cashAccount = await paymentAccountService.create({
      accountType: 'CASH',
      displayName: 'Main Cash',
      qrEnabled: false,
      isDefault: true,
      isActive: true,
      displayOrder: 3,
    });
    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: cashAccount.id,
      amount: 10000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    phonePeUpi = await paymentAccountService.create({
      accountType: 'UPI',
      displayName: 'PhonePe UPI',
      upiId: 'test@ybl',
      qrEnabled: false,
      isDefault: false,
      isActive: true,
      displayOrder: 4,
    });
    await paymentAccountOpeningBalanceService.createOpeningBalance({
      paymentAccountId: phonePeUpi.id,
      amount: 5000,
      balanceType: 'Dr',
      voucherDate: new Date('2026-04-01'),
    });

    const tb = await trialBalanceService.getTrialBalance(companyId, fyId, new Date('2026-04-01'));
    expect(tb.grandTotalDebit).toBe(165000);
    expect(tb.grandTotalCredit).toBe(165000);
  });

  const transfers: FundTransferDto[] = [];

  it('2. Perform Transfer Combinations', async () => {
    // Bank -> Bank
    const t1 = await fundTransferService.createTransfer({
      transferType: 'BANK_TO_BANK',
      sourceAccountId: hdfcBank.id,
      destinationAccountId: sbiBank.id,
      amount: 5000,
      transferDate: new Date('2026-04-05'),
    });
    transfers.push(t1);

    // Bank -> Cash
    const t2 = await fundTransferService.createTransfer({
      transferType: 'BANK_TO_CASH',
      sourceAccountId: sbiBank.id,
      destinationAccountId: cashAccount.id,
      amount: 2000,
      transferDate: new Date('2026-04-06'),
    });
    transfers.push(t2);

    // Cash -> Bank
    const t3 = await fundTransferService.createTransfer({
      transferType: 'CASH_TO_BANK',
      sourceAccountId: cashAccount.id,
      destinationAccountId: hdfcBank.id,
      amount: 1000,
      transferDate: new Date('2026-04-07'),
    });
    transfers.push(t3);

    // Bank -> UPI
    const t4 = await fundTransferService.createTransfer({
      transferType: 'BANK_TO_UPI',
      sourceAccountId: hdfcBank.id,
      destinationAccountId: phonePeUpi.id,
      amount: 3000,
      transferDate: new Date('2026-04-08'),
    });
    transfers.push(t4);

    // UPI -> Bank
    const t5 = await fundTransferService.createTransfer({
      transferType: 'UPI_TO_BANK',
      sourceAccountId: phonePeUpi.id,
      destinationAccountId: sbiBank.id,
      amount: 1000,
      transferDate: new Date('2026-04-09'),
    });
    transfers.push(t5);

    // Cash -> UPI
    const t6 = await fundTransferService.createTransfer({
      transferType: 'CASH_TO_UPI',
      sourceAccountId: cashAccount.id,
      destinationAccountId: phonePeUpi.id,
      amount: 500,
      transferDate: new Date('2026-04-10'),
    });
    transfers.push(t6);

    // UPI -> Cash
    const t7 = await fundTransferService.createTransfer({
      transferType: 'UPI_TO_CASH',
      sourceAccountId: phonePeUpi.id,
      destinationAccountId: cashAccount.id,
      amount: 1500,
      transferDate: new Date('2026-04-11'),
    });
    transfers.push(t7);

    expect(transfers.length).toBe(7);
  });

  it('3. Verify Balances After Transfers', async () => {
    const fromDate = new Date('2026-04-01');
    const glReport = await generalLedgerService.getGeneralLedger(companyId, fyId, fromDate);

    // HDFC Bank: 100000 - 5000 + 1000 - 3000 = 93000
    const hdfcGl = glReport.statements.find((s) => s.ledgerId === hdfcBank.ledgerId);
    expect(hdfcGl?.closingBalance.amount).toBe(93000);

    // SBI Bank: 50000 + 5000 - 2000 + 1000 = 54000
    const sbiGl = glReport.statements.find((s) => s.ledgerId === sbiBank.ledgerId);
    expect(sbiGl?.closingBalance.amount).toBe(54000);

    // Cash: 10000 + 2000 - 1000 - 500 + 1500 = 12000
    const cashGl = glReport.statements.find((s) => s.ledgerId === cashAccount.ledgerId);
    expect(cashGl?.closingBalance.amount).toBe(12000);

    // PhonePe: 5000 + 3000 - 1000 + 500 - 1500 = 6000
    const phonePeGl = glReport.statements.find((s) => s.ledgerId === phonePeUpi.ledgerId);
    expect(phonePeGl?.closingBalance.amount).toBe(6000);
  });

  it('4. Same-Account Transfer Prevention Validation', async () => {
    await expect(
      fundTransferService.createTransfer({
        transferType: 'BANK_TO_BANK',
        sourceAccountId: hdfcBank.id,
        destinationAccountId: hdfcBank.id, // Same account
        amount: 1000,
        transferDate: new Date('2026-04-12'),
      }),
    ).rejects.toThrow();
  });

  it('5. Verify Audit Trail and Document Numbering on Reversals', async () => {
    const t2 = transfers[1]; // Bank -> Cash (SBI to Cash, 2000)

    const originalVouchersCount = db.select().from(vouchers).all().length;

    await fundTransferService.reverseTransfer(t2.id);

    const afterVouchersCount = db.select().from(vouchers).all().length;
    expect(afterVouchersCount).toBe(originalVouchersCount + 1); // 1 reversal voucher added

    const reversedVoucher = db.select().from(vouchers).where(eq(vouchers.id, t2.id)).all()[0];

    expect(reversedVoucher.isCancelled).toBe(true);

    const reversalVoucher = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceId, t2.id))
      .all()[0];

    expect(reversalVoucher).toBeDefined();
    expect(reversalVoucher.isCancelled).toBe(false);
    expect(reversalVoucher.voucherType).toBe('Journal');
  });

  it('6. Verify Balances after Reversals', async () => {
    const fromDate = new Date('2026-04-01');

    const glReport = await generalLedgerService.getGeneralLedger(companyId, fyId, fromDate);

    // T2 was SBI to Cash (2000). Reversing it should add 2000 back to SBI, and remove 2000 from Cash.
    // SBI Bank was 54000. Now should be 56000.
    const sbiGl = glReport.statements.find((s) => s.ledgerId === sbiBank.ledgerId);
    expect(sbiGl?.closingBalance.amount).toBe(56000);

    // Cash was 12000. Now should be 10000.
    const cashGl = glReport.statements.find((s) => s.ledgerId === cashAccount.ledgerId);
    expect(cashGl?.closingBalance.amount).toBe(10000);
  });

  it('7. Atomicity Validation (Force failure and verify rollback)', async () => {
    await expect(
      fundTransferService.createTransfer({
        transferType: 'BANK_TO_BANK',
        sourceAccountId: hdfcBank.id,
        destinationAccountId: 'invalid-id-that-throws-error',
        amount: 1000,
        transferDate: new Date('2026-04-12'),
      }),
    ).rejects.toThrow();

    // Verify HDFC balance is still 93000
    const glReport = await generalLedgerService.getGeneralLedger(
      companyId,
      fyId,
      new Date('2026-04-01'),
    );
    const hdfcGl = glReport.statements.find((s) => s.ledgerId === hdfcBank.ledgerId);
    expect(hdfcGl?.closingBalance.amount).toBe(93000);
  });

  it('8. Inactive Accounts Validation', async () => {
    await paymentAccountService.update(sbiBank.id, { isActive: false });

    await expect(
      fundTransferService.createTransfer({
        transferType: 'BANK_TO_BANK',
        sourceAccountId: hdfcBank.id,
        destinationAccountId: sbiBank.id,
        amount: 1000,
        transferDate: new Date('2026-04-13'),
      }),
    ).rejects.toThrow();

    await paymentAccountService.update(sbiBank.id, { isActive: true });
  });

  it('9. Locked Financial Year Validation', async () => {
    // Mock Context to reflect locked (inactive) status
    vi.spyOn(financialYearContextService, 'getActiveFinancialYear').mockReturnValue({
      id: fyId,
      companyId,
      label: 'FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isActive: false,
    });

    await expect(
      fundTransferService.createTransfer({
        transferType: 'BANK_TO_CASH',
        sourceAccountId: hdfcBank.id,
        destinationAccountId: cashAccount.id,
        amount: 1000,
        transferDate: new Date('2026-04-14'),
      }),
    ).rejects.toThrow();

    await expect(fundTransferService.reverseTransfer(transfers[0].id)).rejects.toThrow();

    // Unlock mock handled in afterEach
  });

  it('10. Final Accounting Reconciliation', async () => {
    const tb = await trialBalanceService.getTrialBalance(companyId, fyId, new Date('2026-04-01'));
    expect(tb.grandTotalDebit).toBe(tb.grandTotalCredit);

    const dbTotalVouchers = db.select().from(vouchers).all().length;
    // OB vouchers (4) + Transfers (7) + Reversals (1) = 12
    expect(dbTotalVouchers).toBe(12);

    const dbTotalEntries = db.select().from(voucher_entries).all().length;
    // OB entries (8) + Transfer entries (14) + Reversal entries (2) = 24
    expect(dbTotalEntries).toBe(24);
  });
  it('11. Opening Balance Correction Workflow', async () => {
    const obInput = {
      paymentAccountId: cashAccount.id,
      amount: 1500,
      balanceType: 'Dr' as const,
      voucherDate: new Date('2026-04-01'),
      notes: 'Corrected Opening Balance',
    };

    // 1. Edit Opening Balance
    await paymentAccountOpeningBalanceService.updateOpeningBalance(obInput);

    // 2. Verify vouchers
    const relatedVouchers = db
      .select()
      .from(vouchers)
      .where(eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'))
      .all()
      .filter((v) => v.referenceId === cashAccount.id);

    // There should be 3 vouchers: original (cancelled), reversal, and new (active)
    expect(relatedVouchers.length).toBe(3);

    const original = relatedVouchers.find((v) => v.voucherNumber === 'JV-2026-27-0004'); // Assuming this was the original OB
    const active = relatedVouchers.find((v) => v.isCancelled === false);
    const reversal = relatedVouchers.find(
      (v) => v.reversalVoucherId === null && v.isCancelled === true && v.id !== original?.id,
    );

    // Check active and reversal
    expect(active).toBeDefined();
    expect(active?.referenceId).toBe(cashAccount.id);
    expect(reversal).toBeDefined();

    // Check that there is EXACTLY ONE active
    const activeCount = relatedVouchers.filter((v) => !v.isCancelled).length;
    expect(activeCount).toBe(1);

    // 3. Verify Trial Balance
    const tb = await trialBalanceService.getTrialBalance(companyId, fyId, new Date('2026-04-01'));
    expect(tb.grandTotalDebit).toBe(tb.grandTotalCredit);
  });
});
