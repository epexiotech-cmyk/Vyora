import { randomUUID } from 'crypto';

import { vouchers } from '@vyora/database';
import {
  CreateFundTransferInput,
  FundTransferDto,
  UpdateFundTransferInput,
  FundTransferQueryFilter,
  FundTransferListDto,
  DocumentType,
} from '@vyora/types';
import { and, eq } from 'drizzle-orm';

import type { DbTransaction } from '../repositories/BaseRepository';
import { fundTransferRepository } from '../repositories/FundTransferRepository';
import { paymentAccountRepository } from '../repositories/PaymentAccountRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { journalService } from './JournalService';

export class FundTransferService {
  private validateTransferTypeMapping(sourceType: string, destType: string, transferType: string) {
    const expectedType = `${sourceType}_TO_${destType}`;
    if (expectedType !== transferType) {
      throw new Error(
        `Transfer type '${transferType}' is invalid. Source account is '${sourceType}' and destination account is '${destType}'. Expected '${expectedType}'.`,
      );
    }
  }

  public async createTransfer(
    input: CreateFundTransferInput,
    providedTx?: DbTransaction,
    _preserveId?: string,
  ): Promise<FundTransferDto> {
    const execute = async (tx: DbTransaction) => {
      const companyId = companyContextService.getActiveCompany();
      const fy = financialYearContextService.getActiveFinancialYear();
      if (!companyId) throw new Error('No active company context');
      if (!fy) throw new Error('No active financial year context');

      if (input.sourceAccountId === input.destinationAccountId) {
        throw new Error('Source and destination accounts cannot be the same');
      }

      if (input.amount <= 0) {
        throw new Error('Transfer amount must be greater than zero');
      }

      const sourceAccount = await paymentAccountRepository.getById(input.sourceAccountId, tx);
      const destAccount = await paymentAccountRepository.getById(input.destinationAccountId, tx);

      if (!sourceAccount) throw new Error('Source account not found');
      if (!destAccount) throw new Error('Destination account not found');
      if (!sourceAccount.isActive) throw new Error('Source account is inactive');
      if (!destAccount.isActive) throw new Error('Destination account is inactive');

      this.validateTransferTypeMapping(
        sourceAccount.accountType,
        destAccount.accountType,
        input.transferType,
      );

      const generatedVoucherNumber = await documentNumberingService.generateNextNumberSync(
        companyId,
        DocumentType.CONTRA_VOUCHER,
        fy.id,
        tx,
      );

      const fundTransferId = _preserveId || randomUUID();
      let narration = input.remarks || `Fund transfer: ${input.transferType}`;
      if (input.referenceNumber) {
        narration += ` (Ref: ${input.referenceNumber})`;
      }

      await journalService.createVoucher(
        {
          voucherType: 'Contra',
          voucherNumber: generatedVoucherNumber,
          voucherDate: input.transferDate,
          sourceModule: 'FundTransferService',
          referenceType: 'FUND_TRANSFER',
          referenceId: fundTransferId,
          narration,
          entries: [
            {
              ledgerId: sourceAccount.ledgerId,
              debitAmount: 0,
              creditAmount: input.amount,
              narration: `Fund transfer to ${destAccount.displayName}`,
            },
            {
              ledgerId: destAccount.ledgerId,
              debitAmount: input.amount,
              creditAmount: 0,
              narration: `Fund transfer from ${sourceAccount.displayName}`,
            },
          ],
        },
        tx,
      );

      return {
        id: fundTransferId,
        voucherNumber: generatedVoucherNumber,
        transferType: input.transferType,
        sourceAccountId: sourceAccount.id,
        sourceAccountName: sourceAccount.displayName,
        destinationAccountId: destAccount.id,
        destinationAccountName: destAccount.displayName,
        amount: input.amount,
        transferDate: new Date(input.transferDate),
        referenceNumber: input.referenceNumber,
        remarks: input.remarks || undefined,
        isCancelled: false,
        createdAt: new Date(),
      };
    };

    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public async reverseTransfer(
    fundTransferId: string,
    providedTx?: DbTransaction,
  ): Promise<{ reversalVoucherId: string }> {
    const execute = async (tx: DbTransaction) => {
      const companyId = companyContextService.getActiveCompany();
      if (!companyId) throw new Error('No active company context');

      const voucher = tx
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId, companyId),
            eq(vouchers.referenceType, 'FUND_TRANSFER'),
            eq(vouchers.referenceId, fundTransferId),
            eq(vouchers.isCancelled, false),
          ),
        )
        .get();

      if (!voucher) {
        throw new Error('Active fund transfer not found for reversal');
      }

      return journalService.cancelVoucher(voucher.id, { allowSystemVoucherCancellation: true });
    };

    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public async updateTransfer(
    fundTransferId: string,
    input: UpdateFundTransferInput,
    providedTx?: DbTransaction,
  ): Promise<FundTransferDto> {
    const execute = async (tx: DbTransaction) => {
      const companyId = companyContextService.getActiveCompany();
      const fy = financialYearContextService.getActiveFinancialYear();
      if (!companyId || !fy) throw new Error('No active context');

      const voucher = tx
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId, companyId),
            eq(vouchers.referenceType, 'FUND_TRANSFER'),
            eq(vouchers.referenceId, fundTransferId),
            eq(vouchers.isCancelled, false),
          ),
        )
        .get();

      if (!voucher) {
        throw new Error('Active fund transfer not found for update');
      }

      await this.reverseTransfer(fundTransferId, tx);

      const createInput = input as CreateFundTransferInput;
      return this.createTransfer(createInput, tx, fundTransferId);
    };

    return providedTx ? execute(providedTx) : dbService.getDb().transaction(execute);
  }

  public async getTransfers(filter: FundTransferQueryFilter): Promise<FundTransferListDto> {
    const companyId = companyContextService.getActiveCompany();
    const fy = financialYearContextService.getActiveFinancialYear();
    if (!companyId || !fy) throw new Error('No active context');

    const result = await fundTransferRepository.getFundTransfers(companyId, fy.id, filter);

    const data = result.records.map((record) => {
      const transferTypeMatch = record.narration?.match(/Fund transfer: (.*)$/);
      const transferType = transferTypeMatch ? transferTypeMatch[1] : 'UNKNOWN';

      return {
        id: record.id,
        voucherNumber: record.voucherNumber,
        transferType: transferType as import('@vyora/types').TransferType,
        sourceAccountId: record.creditAccountId || '',
        sourceAccountName: record.creditAccountName || 'Unknown',
        destinationAccountId: record.debitAccountId || '',
        destinationAccountName: record.debitAccountName || 'Unknown',
        amount: record.amount,
        transferDate: new Date(record.voucherDate),
        referenceNumber: '',
        remarks: record.narration || undefined,
        isCancelled: record.isCancelled,
        createdAt: new Date(record.createdAt),
      };
    });

    let filteredData = data;
    if (filter.sourceAccountId) {
      filteredData = filteredData.filter((d) => d.sourceAccountId === filter.sourceAccountId);
    }
    if (filter.destinationAccountId) {
      filteredData = filteredData.filter(
        (d) => d.destinationAccountId === filter.destinationAccountId,
      );
    }
    if (filter.minAmount) {
      filteredData = filteredData.filter((d) => d.amount >= filter.minAmount!);
    }
    if (filter.maxAmount) {
      filteredData = filteredData.filter((d) => d.amount <= filter.maxAmount!);
    }

    return { data: filteredData, total: result.total };
  }
}

export const fundTransferService = new FundTransferService();
