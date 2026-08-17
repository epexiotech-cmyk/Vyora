import { randomUUID } from 'crypto';

import { payment_accounts, ledgers, InsertPaymentAccount, PaymentAccount } from '@vyora/database';
import {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
  PaymentAccountDto,
  PaymentAccountFilterDto,
} from '@vyora/types';
import { eq, and, ne, like, or, asc } from 'drizzle-orm';

import type { DbTransaction } from '../repositories/BaseRepository';
import { ChartOfAccountsRepository } from '../repositories/ChartOfAccountsRepository';
import { PaymentAccountRepository } from '../repositories/PaymentAccountRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { paymentAccountOpeningBalanceService } from './PaymentAccountOpeningBalanceService';

export class PaymentAccountDeletionError extends Error {
  public code: string;
  public reason: string;
  public journalCount: number;
  public voucherCount: number;
  public ledgerId: string;
  public recommendedAction: 'deactivate' | 'delete';

  constructor(
    reason: string,
    counts: { journalCount: number; voucherCount: number },
    ledgerId: string,
  ) {
    super(`Cannot delete payment account because it has associated history: ${reason}.`);
    this.name = 'PaymentAccountDeletionError';
    this.code = 'ACCOUNT_HAS_HISTORY';
    this.reason = 'HAS_TRANSACTIONS';
    this.journalCount = counts.journalCount;
    this.voucherCount = counts.voucherCount;
    this.ledgerId = ledgerId;
    this.recommendedAction = 'deactivate';
  }
}

export class PaymentAccountService {
  private repo = new PaymentAccountRepository();
  private coaRepo = new ChartOfAccountsRepository();

  public async getById(id: string): Promise<PaymentAccountDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const result = await dbService
      .getDb()
      .select()
      .from(payment_accounts)
      .where(and(eq(payment_accounts.id, id), eq(payment_accounts.companyId, companyId)))
      .get();
    return (result as PaymentAccountDto) || null;
  }

  public async search(filter: PaymentAccountFilterDto): Promise<PaymentAccountDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const filters = [eq(payment_accounts.companyId, companyId)];

    if (filter.accountType) {
      filters.push(
        eq(payment_accounts.accountType, filter.accountType as PaymentAccount['accountType']),
      );
    }
    if (filter.isActive !== undefined) {
      filters.push(eq(payment_accounts.isActive, filter.isActive));
    }

    if (filter.showSystemAccounts === false) {
      filters.push(eq(payment_accounts.isSystem, false));
    }

    if (filter.searchQuery) {
      const q = `%${filter.searchQuery}%`;
      const condition = or(
        like(payment_accounts.displayName, q),
        like(payment_accounts.bankName, q),
        like(payment_accounts.accountNumber, q),
        like(payment_accounts.upiId, q),
      );
      if (condition) {
        filters.push(condition);
      }
    }

    const query = dbService
      .getDb()
      .select()
      .from(payment_accounts)
      .where(and(...filters))
      .orderBy(
        asc(payment_accounts.displayOrder),
        asc(payment_accounts.displayName),
        asc(payment_accounts.createdAt),
      );

    const results = await query.all();

    // N+1 fix: get transaction counts in bulk
    const ledgerIds = results.map((r) => r.ledgerId);
    const counts = this.coaRepo.getBulkTransactionCounts(ledgerIds);

    return results.map((account) => {
      const { nonOpeningCount } = counts[account.ledgerId] || {
        nonOpeningCount: 0,
      };

      const hasNonOpeningLedgerEntries = nonOpeningCount > 0;

      const capabilities = {
        canEdit: true,
        canDelete: !hasNonOpeningLedgerEntries && !account.isSystem,
        canDeactivate: account.isActive,
        canActivate: !account.isActive,
        hasNonOpeningLedgerEntries,
      };

      return {
        ...(account as PaymentAccountDto),
        capabilities,
      };
    });
  }

  public create(
    data: CreatePaymentAccountInput,
    systemLedgerId?: string,
    providedTx?: DbTransaction,
  ): PaymentAccountDto {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    this.validateUniqueness(companyId, data, undefined, providedTx);

    const execute = (tx: DbTransaction) => {
      // Create or use existing ledger
      let ledgerId = systemLedgerId;

      if (!ledgerId) {
        // Determine the group name
        let targetGroupName = 'Bank Accounts';
        if (data.accountType === 'CASH') targetGroupName = 'Cash In Hand';

        const group = this.coaRepo.getGroupByName(companyId, targetGroupName, tx as DbTransaction);
        if (!group) throw new Error(`Required ledger group "${targetGroupName}" not found`);

        const ledger = this.coaRepo.createLedger(
          companyId,
          {
            groupId: group.id,
            name: data.displayName,
            openingBalance: 0,
            openingType: 'Dr',
            notes: data.notes || '',
            isActive: data.isActive ?? true,
          },
          tx as DbTransaction,
        );

        // Update reference type to BANK
        tx.update(ledgers)
          .set({ referenceType: data.accountType === 'CASH' ? 'SYSTEM' : 'BANK' })
          .where(eq(ledgers.id, ledger.id))
          .run();

        ledgerId = ledger.id;
      }

      if (data.isDefault) {
        this.unsetOtherDefaults(companyId, data.accountType, undefined, tx as DbTransaction);
      }

      const id = randomUUID();
      const now = new Date();

      const insertData: InsertPaymentAccount = {
        id,
        companyId,
        ledgerId,
        accountType: data.accountType,
        displayName: data.displayName,
        displayOrder: data.displayOrder ?? 0,
        bankName: data.bankName || null,
        accountHolderName: data.accountHolderName || null,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        branchName: data.branchName || null,
        upiId: data.upiId || null,
        merchantName: data.merchantName || null,
        qrEnabled: data.qrEnabled ?? false,
        isDefault: data.isDefault ?? false,
        isSystem: false,
        isActive: data.isActive ?? true,
        notes: data.notes || null,
        syncVersion: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      tx.insert(payment_accounts).values(insertData).run();

      const created = tx.select().from(payment_accounts).where(eq(payment_accounts.id, id)).get();
      return created as PaymentAccountDto;
    };
    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public update(
    id: string,
    data: UpdatePaymentAccountInput,
    providedTx?: DbTransaction,
  ): PaymentAccountDto {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const execute = (tx: DbTransaction) => {
      const existing = tx
        .select()
        .from(payment_accounts)
        .where(and(eq(payment_accounts.id, id), eq(payment_accounts.companyId, companyId)))
        .get();
      if (!existing) throw new Error('Payment account not found');

      this.validateUniqueness(companyId, data, id, tx as DbTransaction);

      if (data.isDefault) {
        this.unsetOtherDefaults(companyId, existing.accountType, id, tx as DbTransaction);
      }

      const updateData = {
        ...data,
        syncVersion: (existing.syncVersion || 1) + 1,
        updatedAt: new Date(),
      };

      // Ensure we don't overwrite accountType if not provided
      if (updateData.accountType === undefined) {
        delete updateData.accountType;
      }

      tx.update(payment_accounts)
        .set(updateData as Partial<InsertPaymentAccount>)
        .where(eq(payment_accounts.id, id))
        .run();

      if (data.displayName && data.displayName !== existing.displayName) {
        // Update ledger name
        this.coaRepo.updateLedger(
          existing.ledgerId,
          companyId,
          { name: data.displayName },
          tx as DbTransaction,
        );
      }

      const updated = tx.select().from(payment_accounts).where(eq(payment_accounts.id, id)).get();
      return updated as PaymentAccountDto;
    };
    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public delete(id: string): void {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    dbService.getDb().transaction((tx) => {
      const existing = tx
        .select()
        .from(payment_accounts)
        .where(and(eq(payment_accounts.id, id), eq(payment_accounts.companyId, companyId)))
        .get();
      if (!existing) throw new Error('Payment account not found');

      const counts = this.coaRepo.getTransactionCounts(existing.ledgerId, tx as DbTransaction);
      const hasTransactions = counts.nonOpeningCount > 0;
      if (hasTransactions) {
        throw new PaymentAccountDeletionError(
          'Cannot delete payment account because it has associated journal entries.',
          counts,
          existing.ledgerId,
        );
      }

      if (paymentAccountOpeningBalanceService.hasActiveOpeningBalance(id, tx as DbTransaction)) {
        paymentAccountOpeningBalanceService.reverseOpeningBalance(id, tx as DbTransaction);
      }

      tx.delete(payment_accounts).where(eq(payment_accounts.id, id)).run();

      // Attempt to deactivate ledger rather than full delete, standard practice
      const ledger = this.coaRepo.getLedgerById(existing.ledgerId, companyId, tx as DbTransaction);
      if (ledger) {
        this.coaRepo.deactivateLedger(existing.ledgerId, companyId, tx as DbTransaction);
      }
    });
  }

  private unsetOtherDefaults(
    companyId: string,
    accountType: string,
    excludeId?: string,
    tx?: DbTransaction,
  ) {
    const executor = tx || dbService.getDb();
    let query = executor
      .update(payment_accounts)
      .set({ isDefault: false })
      .where(
        and(
          eq(payment_accounts.companyId, companyId),
          eq(payment_accounts.accountType, accountType as PaymentAccount['accountType']),
        ),
      );

    // Exclude the current account if specified
    if (excludeId) {
      query = executor
        .update(payment_accounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(payment_accounts.companyId, companyId),
            eq(payment_accounts.accountType, accountType as PaymentAccount['accountType']),
            ne(payment_accounts.id, excludeId),
          ),
        );
    }

    query.run();
  }

  private validateUniqueness(
    companyId: string,
    data: Partial<CreatePaymentAccountInput>,
    excludeId?: string,
    tx?: DbTransaction,
  ) {
    const executor = tx || dbService.getDb();

    if (data.accountNumber) {
      const q = executor
        .select()
        .from(payment_accounts)
        .where(
          and(
            eq(payment_accounts.companyId, companyId),
            eq(payment_accounts.accountNumber, data.accountNumber),
          ),
        );
      const existing = q.all();
      const conflicts = excludeId ? existing.filter((e) => e.id !== excludeId) : existing;
      if (conflicts.length > 0) {
        throw new Error(`Account number ${data.accountNumber} is already in use.`);
      }
    }

    if (data.upiId) {
      const q = executor
        .select()
        .from(payment_accounts)
        .where(
          and(eq(payment_accounts.companyId, companyId), eq(payment_accounts.upiId, data.upiId)),
        );
      const existing = q.all();
      const conflicts = excludeId ? existing.filter((e) => e.id !== excludeId) : existing;
      if (conflicts.length > 0) {
        throw new Error(`UPI ID ${data.upiId} is already in use.`);
      }
    }
  }
}

export const paymentAccountService = new PaymentAccountService();
