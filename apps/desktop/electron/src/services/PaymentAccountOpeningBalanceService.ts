import { randomUUID } from 'crypto';

import {
  ledgers,
  payment_accounts,
  vouchers,
  InsertVoucher,
  InsertVoucherEntry,
} from '@vyora/database';
import { CreateOpeningBalanceInput, DocumentType, VoucherDetailDto } from '@vyora/types';
import { and, eq } from 'drizzle-orm';

import { DbTransaction } from '../repositories/BaseRepository';
import { journalRepository } from '../repositories/JournalRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { systemLedgerResolver } from './SystemLedgerResolverService';

export class PaymentAccountOpeningBalanceService {
  public createOpeningBalance(
    input: CreateOpeningBalanceInput,
    providedTx?: DbTransaction,
  ): { voucherId: string } {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    if (!fy.isActive) {
      throw new Error(
        `ERR_FINANCIAL_YEAR_LOCKED: Cannot post to closed financial year ${fy.label}`,
      );
    }

    const vTime = input.voucherDate.getTime();
    if (vTime < fy.startDate.getTime() || vTime > fy.endDate.getTime()) {
      throw new Error(
        `ERR_INVALID_DATE: Opening date must be within the active financial year (${fy.label})`,
      );
    }

    if (input.amount < 0) {
      throw new Error('Opening balance amount cannot be negative');
    }

    const execute = (tx: DbTransaction) => {
      // 1. Explicit lookup to prevent duplicates
      const existing = tx
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId, companyId),
            eq(vouchers.voucherType, 'OPENING_BALANCE'),
            eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
            eq(vouchers.referenceId, input.paymentAccountId),
            eq(vouchers.isCancelled, false),
          ),
        )
        .get();

      if (existing) {
        throw new Error(
          'An opening balance already exists for this payment account in the current financial year.',
        );
      }

      // 2. Resolve Ledgers
      const paymentAccount = tx
        .select()
        .from(payment_accounts)
        .where(eq(payment_accounts.id, input.paymentAccountId))
        .get();
      if (!paymentAccount) throw new Error('Payment account not found');

      const paymentLedger = tx
        .select()
        .from(ledgers)
        .where(eq(ledgers.id, paymentAccount.ledgerId))
        .get();
      if (!paymentLedger) throw new Error('Ledger for payment account not found');

      const openingBalanceAdjLedger = systemLedgerResolver.getSystemLedgerByName(
        'Opening Balance Adj',
        tx,
      );

      // 3. Build Entries
      const entries: InsertVoucherEntry[] = [];
      const voucherId = randomUUID();

      if (input.balanceType === 'Dr') {
        entries.push({
          id: randomUUID(),
          voucherId,
          lineNumber: 1,
          ledgerId: paymentLedger.id,
          debitAmount: input.amount,
          creditAmount: 0,
          entryDate: input.voucherDate,
          narration: input.notes || 'Opening Balance',
          createdAt: new Date(),
          syncVersion: 1,
        });
        entries.push({
          id: randomUUID(),
          voucherId,
          lineNumber: 2,
          ledgerId: openingBalanceAdjLedger.id,
          debitAmount: 0,
          creditAmount: input.amount,
          entryDate: input.voucherDate,
          narration: input.notes || 'Opening Balance Offset',
          createdAt: new Date(),
          syncVersion: 1,
        });
      } else {
        entries.push({
          id: randomUUID(),
          voucherId,
          lineNumber: 1,
          ledgerId: paymentLedger.id,
          debitAmount: 0,
          creditAmount: input.amount,
          entryDate: input.voucherDate,
          narration: input.notes || 'Opening Balance',
          createdAt: new Date(),
          syncVersion: 1,
        });
        entries.push({
          id: randomUUID(),
          voucherId,
          lineNumber: 2,
          ledgerId: openingBalanceAdjLedger.id,
          debitAmount: input.amount,
          creditAmount: 0,
          entryDate: input.voucherDate,
          narration: input.notes || 'Opening Balance Offset',
          createdAt: new Date(),
          syncVersion: 1,
        });
      }

      const generatedVoucherNumber = documentNumberingService.generateNextNumberSync(
        companyId,
        DocumentType.JOURNAL_VOUCHER,
        fy.id,
        tx,
      );

      const voucher: InsertVoucher = {
        id: voucherId,
        companyId,
        financialYearId: fy.id,
        voucherType: 'OPENING_BALANCE',
        voucherNumber: generatedVoucherNumber,
        voucherDate: input.voucherDate,
        sourceModule: 'PaymentAccountOpeningBalanceService',
        referenceType: 'PAYMENT_ACCOUNT_OPENING',
        referenceId: input.paymentAccountId,
        narration: input.notes || 'Payment Account Opening Balance',
        isCancelled: false,
        isFrozen: false,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      journalRepository.createVoucher(voucher, entries, tx);
      return { voucherId };
    };

    if (providedTx) {
      return execute(providedTx);
    } else {
      return dbService.getDb().transaction(execute);
    }
  }

  public reverseOpeningBalance(
    paymentAccountId: string,
    providedTx?: DbTransaction,
  ): { cancelledVoucherId: string } {
    const execute = (tx: DbTransaction) => {
      const companyId = companyContextService.getActiveCompany();
      if (!companyId) throw new Error('No active company found');

      const fy = financialYearContextService.getActiveFinancialYear();
      if (!fy) throw new Error('No active financial year context');

      if (!fy.isActive) {
        throw new Error(
          `ERR_FINANCIAL_YEAR_LOCKED: Cannot post to closed financial year ${fy.label}`,
        );
      }

      const originalVoucher = tx
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId, companyId),
            eq(vouchers.voucherType, 'OPENING_BALANCE'),
            eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
            eq(vouchers.referenceId, paymentAccountId),
            eq(vouchers.isCancelled, false),
          ),
        )
        .get();

      if (!originalVoucher) {
        throw new Error('No active opening balance voucher found to reverse.');
      }

      journalRepository.cancelVoucher(originalVoucher.id, tx);

      return { cancelledVoucherId: originalVoucher.id };
    };

    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public updateOpeningBalance(
    input: CreateOpeningBalanceInput,
    providedTx?: DbTransaction,
  ): { voucherId: string } {
    const execute = (tx: DbTransaction) => {
      // Look for existing to reverse
      const companyId = companyContextService.getActiveCompany();
      const fy = financialYearContextService.getActiveFinancialYear();
      if (!companyId || !fy) throw new Error('No active context');

      const existing = tx
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId, companyId),
            eq(vouchers.voucherType, 'OPENING_BALANCE'),
            eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
            eq(vouchers.referenceId, input.paymentAccountId),
            eq(vouchers.isCancelled, false),
          ),
        )
        .get();

      if (existing) {
        this.reverseOpeningBalance(input.paymentAccountId, tx);
      }

      return this.createOpeningBalance(input, tx);
    };
    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public hasActiveOpeningBalance(paymentAccountId: string, tx?: DbTransaction): boolean {
    const executor = tx || dbService.getDb();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) return false;

    const existing = executor
      .select({ id: vouchers.id })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.voucherType, 'OPENING_BALANCE'),
          eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
          eq(vouchers.referenceId, paymentAccountId),
          eq(vouchers.isCancelled, false),
        ),
      )
      .get();

    return !!existing;
  }

  public getOpeningBalance(paymentAccountId: string): VoucherDetailDto | null {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company found');

    const fy = financialYearContextService.getActiveFinancialYear();
    if (!fy) throw new Error('No active financial year context');

    const originalVoucher = dbService
      .getDb()
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.voucherType, 'OPENING_BALANCE'),
          eq(vouchers.referenceType, 'PAYMENT_ACCOUNT_OPENING'),
          eq(vouchers.referenceId, paymentAccountId),
          eq(vouchers.isCancelled, false),
        ),
      )
      .get();

    if (!originalVoucher) return null;

    return journalRepository.getVoucherById(originalVoucher.id);
  }
}

export const paymentAccountOpeningBalanceService = new PaymentAccountOpeningBalanceService();
