import { randomUUID } from 'crypto';

import {
  sales_invoices,
  purchase_invoices,
  settlements,
  settlement_allocations,
  payment_accounts,
  ledgers,
} from '@vyora/database';
import {
  CreateSettlementInput,
  UpdateSettlementInput,
  InvoiceStatus,
  AllocationDocumentType,
  DocumentType,
  ListSettlementsOptions,
  SettlementListDto,
} from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { TransactionExecutor } from '../repositories/BaseRepository';
import { PurchaseRepository } from '../repositories/PurchaseRepository';
import { SalesInvoiceRepository } from '../repositories/SalesInvoiceRepository';
import { settlementRepository } from '../repositories/SettlementRepository';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { journalService } from './JournalService';
export class SettlementService {
  private salesInvoiceRepo = new SalesInvoiceRepository();
  private purchaseRepo = new PurchaseRepository();

  public async createSettlement(input: CreateSettlementInput): Promise<{ settlementId: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const financialYear = financialYearContextService.getActiveFinancialYear();
    if (!financialYear) throw new Error('No active financial year');
    const financialYearId = financialYear.id;

    // Validation rules: Reject negative/zero payment amounts
    if (input.amount <= 0) {
      throw new Error('Settlement amount must be greater than zero');
    }

    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (totalAllocated !== input.amount) {
      throw new Error(
        `Total allocated amount (${totalAllocated}) must exactly equal settlement amount (${input.amount})`,
      );
    }

    const unallocatedAmount = 0; // Forced to zero per strict rules
    const settlementId = randomUUID();

    // Determine type from party type
    const settlementType = input.partyType === 'CUSTOMER' ? 'RECEIPT' : 'PAYMENT';

    return dbService.getDb().transaction((tx) => {
      // 1. Resolve and validate payment account
      const paymentAccount = tx
        .select()
        .from(payment_accounts)
        .where(
          and(
            eq(payment_accounts.id, input.paymentAccountId),
            eq(payment_accounts.companyId, companyId),
          ),
        )
        .get();

      if (!paymentAccount) {
        throw new Error('Payment account not found or does not belong to the current company');
      }

      if (!paymentAccount.isActive) {
        throw new Error('Selected payment account is inactive');
      }

      const resolvedLedgerId = paymentAccount.ledgerId;

      // Validate ledger exists and belongs to company
      const ledger = tx
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.id, resolvedLedgerId), eq(ledgers.companyId, companyId)))
        .get();

      if (!ledger) {
        throw new Error('Resolved ledger not found or does not belong to the current company');
      }

      // 2. Validate all allocations and check balances
      const now = new Date();
      const allocationPayloads = [];

      for (const alloc of input.allocations) {
        if (alloc.allocatedAmount <= 0) {
          throw new Error('Allocated amount must be greater than zero');
        }

        const documentInfo = this.validateAndFetchDocumentBalanceSync(
          alloc.documentType,
          alloc.documentId,
          companyId,
          tx,
        );

        if (alloc.allocatedAmount > documentInfo.balanceDue) {
          throw new Error(
            `Cannot allocate ${alloc.allocatedAmount}. Outstanding balance for ${alloc.documentType} is only ${documentInfo.balanceDue}`,
          );
        }

        allocationPayloads.push({
          id: randomUUID(),
          companyId,
          settlementId,
          documentType: alloc.documentType,
          documentId: alloc.documentId,
          allocatedAmount: alloc.allocatedAmount,
          allocationDate: input.settlementDate,
          syncVersion: 1,
          createdAt: now,
        });
      }

      // 3. Create the settlement and allocations
      const settlementNumber = documentNumberingService.generateNextNumberSync(
        companyId,
        settlementType === 'RECEIPT' ? DocumentType.RECEIPT_VOUCHER : DocumentType.PAYMENT_VOUCHER,
        financialYearId,
        tx,
      );

      const headerPayload = {
        id: settlementId,
        companyId,
        financialYearId,
        settlementType: settlementType as 'RECEIPT' | 'PAYMENT',
        partyType: input.partyType,
        partyId: input.partyId,
        settlementNumber,
        settlementDate: input.settlementDate,
        amount: input.amount,
        allocatedAmount: totalAllocated,
        unallocatedAmount: unallocatedAmount,
        paymentMode: input.paymentMode,
        bankLedgerId: resolvedLedgerId, // Keep storing resolved ledgerId for DB schema compatibility
        referenceNumber: input.referenceNumber || null,
        referenceDate: input.referenceDate || null,
        notes: input.notes || null,
        status: 'COMPLETED' as const,
        isFrozen: false,
        syncVersion: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      settlementRepository.createSettlementSync(headerPayload, allocationPayloads, tx);

      // 4. Update Invoice Statuses based on new balances
      for (const alloc of input.allocations) {
        this.updateDocumentStatusSync(alloc.documentType, alloc.documentId, companyId, tx);
      }

      // 5. Create Journal Voucher
      if (settlementType === 'RECEIPT') {
        journalService.postReceiptSync(
          {
            companyId,
            financialYearId,
            settlementId,
            settlementDate: input.settlementDate,
            partyId: input.partyId,
            bankLedgerId: resolvedLedgerId,
            amount: input.amount,
            narration: input.notes || undefined,
          },
          tx,
        );
      } else {
        journalService.postPaymentSync(
          {
            companyId,
            financialYearId,
            settlementId,
            settlementDate: input.settlementDate,
            partyId: input.partyId,
            bankLedgerId: resolvedLedgerId,
            amount: input.amount,
            narration: input.notes || undefined,
          },
          tx,
        );
      }

      return { settlementId };
    });
  }

  /**
   * Internal sync method to get current amountPaid, balanceDue for a document
   * by summing all existing settlement allocations.
   */
  public async editSettlement(
    settlementId: string,
    input: UpdateSettlementInput,
  ): Promise<{ settlementId: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const financialYear = financialYearContextService.getActiveFinancialYear();
    if (!financialYear) throw new Error('No active financial year');
    const financialYearId = financialYear.id;

    if (input.amount <= 0) {
      throw new Error('Settlement amount must be greater than zero');
    }

    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (totalAllocated !== input.amount) {
      throw new Error(
        `Total allocated amount (${totalAllocated}) must exactly equal settlement amount (${input.amount})`,
      );
    }

    return dbService.getDb().transaction((tx) => {
      // 1. Verify existing settlement
      const settlement = settlementRepository.getSettlementById(settlementId, companyId, tx);
      if (!settlement) {
        throw new Error(`Settlement ${settlementId} not found`);
      }
      if (settlement.status === 'CANCELLED') {
        throw new Error('Cannot edit a CANCELLED settlement');
      }
      if (settlement.status !== 'COMPLETED') {
        throw new Error(
          `Only COMPLETED settlements can be edited. Current status: ${settlement.status}`,
        );
      }
      if (settlement.isFrozen) {
        throw new Error('Cannot edit a settlement in a frozen period');
      }

      // 2. Capture OLD allocation document IDs to recalculate later
      const oldAllocations = settlementRepository.getSettlementAllocationsSync(
        settlementId,
        companyId,
        tx,
      );
      const oldDocIds = oldAllocations.map((a) => ({ type: a.documentType, id: a.documentId }));

      // 3. Resolve and validate new payment account
      const paymentAccount = tx
        .select()
        .from(payment_accounts)
        .where(
          and(
            eq(payment_accounts.id, input.paymentAccountId),
            eq(payment_accounts.companyId, companyId),
          ),
        )
        .get();

      if (!paymentAccount) {
        throw new Error('Payment account not found or does not belong to the current company');
      }
      if (!paymentAccount.isActive) {
        throw new Error('Selected payment account is inactive');
      }

      const resolvedLedgerId = paymentAccount.ledgerId;

      const ledger = tx
        .select()
        .from(ledgers)
        .where(and(eq(ledgers.id, resolvedLedgerId), eq(ledgers.companyId, companyId)))
        .get();

      if (!ledger) {
        throw new Error('Resolved ledger not found or does not belong to the current company');
      }

      // 4. Reverse the old voucher
      journalService.reverseSettlementVoucherSync(settlementId, tx);

      // 5. Validate new allocations (using restored balance)
      const now = new Date();
      const allocationPayloads = [];

      for (const alloc of input.allocations) {
        if (alloc.allocatedAmount <= 0) {
          throw new Error('Allocated amount must be greater than zero');
        }

        // Get current balance (since settlement is currently COMPLETED, its allocation is subtracted)
        const currentBalance = this.getDocumentBalanceSync(
          alloc.documentType,
          alloc.documentId,
          companyId,
          tx,
        );

        // Find if this document was already allocated in the OLD settlement allocations
        const oldAllocForDoc =
          oldAllocations.find((a) => a.documentId === alloc.documentId)?.allocatedAmount || 0;

        // The true balance available to this edit operation is the current balance PLUS what it had already consumed
        const restoredBalanceDue = currentBalance.balanceDue + oldAllocForDoc;

        if (alloc.allocatedAmount > restoredBalanceDue) {
          throw new Error(
            `Cannot allocate ${alloc.allocatedAmount}. Restored outstanding balance for ${alloc.documentType} is only ${restoredBalanceDue}`,
          );
        }

        allocationPayloads.push({
          id: randomUUID(),
          companyId,
          settlementId,
          documentType: alloc.documentType,
          documentId: alloc.documentId,
          allocatedAmount: alloc.allocatedAmount,
          allocationDate: input.settlementDate,
          syncVersion: settlement.syncVersion + 1,
          createdAt: now,
        });
      }

      // 6. Delete old allocations
      tx.delete(settlement_allocations)
        .where(eq(settlement_allocations.settlementId, settlementId))
        .run();

      // 7. Update settlement header
      tx.update(settlements)
        .set({
          settlementDate: input.settlementDate,
          amount: input.amount,
          allocatedAmount: totalAllocated,
          bankLedgerId: resolvedLedgerId,
          referenceNumber: input.referenceNumber || null,
          referenceDate: input.referenceDate || null,
          notes: input.notes || null,
          updatedAt: now,
          syncVersion: settlement.syncVersion + 1,
        })
        .where(eq(settlements.id, settlementId))
        .run();

      // 8. Insert new allocations
      tx.insert(settlement_allocations).values(allocationPayloads).run();

      // 9. Recalculate ALL affected document statuses
      const newDocIds = allocationPayloads.map((a) => ({ type: a.documentType, id: a.documentId }));
      const allDocs = [...oldDocIds, ...newDocIds];

      // Deduplicate by stringifying
      const uniqueDocs = Array.from(new Set(allDocs.map((d) => JSON.stringify(d)))).map((s) =>
        JSON.parse(s),
      );

      for (const doc of uniqueDocs) {
        this.updateDocumentStatusSync(doc.type, doc.id, companyId, tx);
      }

      // 10. Create new Journal Voucher
      if (settlement.settlementType === 'RECEIPT') {
        journalService.postReceiptSync(
          {
            companyId,
            financialYearId,
            settlementId,
            settlementDate: input.settlementDate,
            partyId: settlement.partyId,
            bankLedgerId: resolvedLedgerId,
            amount: input.amount,
            narration: input.notes || undefined,
          },
          tx,
        );
      } else {
        journalService.postPaymentSync(
          {
            companyId,
            financialYearId,
            settlementId,
            settlementDate: input.settlementDate,
            partyId: settlement.partyId,
            bankLedgerId: resolvedLedgerId,
            amount: input.amount,
            narration: input.notes || undefined,
          },
          tx,
        );
      }

      return { settlementId };
    });
  }

  public getDocumentBalanceSync(
    documentType: AllocationDocumentType,
    documentId: string,
    companyId: string,
    tx: TransactionExecutor,
  ) {
    let grandTotal = 0;
    let status: InvoiceStatus = 'DRAFT';

    if (documentType === 'SALES_INVOICE') {
      const invoice = tx
        .select()
        .from(sales_invoices)
        .where(and(eq(sales_invoices.id, documentId), eq(sales_invoices.companyId, companyId)))
        .get();
      if (!invoice) throw new Error('Sales Invoice not found');
      grandTotal = invoice.grandTotal;
      status = invoice.status as InvoiceStatus;
    } else if (documentType === 'PURCHASE_BILL') {
      const invoice = tx
        .select()
        .from(purchase_invoices)
        .where(
          and(eq(purchase_invoices.id, documentId), eq(purchase_invoices.companyId, companyId)),
        )
        .get();
      if (!invoice) throw new Error('Purchase Bill not found');
      grandTotal = invoice.grandTotal;
      status = invoice.status as InvoiceStatus;
    } else {
      throw new Error(`Unsupported document type for balance calculation: ${documentType}`);
    }

    if (status === 'DRAFT' || status === 'CANCELLED') {
      throw new Error(`Cannot pay a ${status} invoice`);
    }

    const allocations = settlementRepository.getInvoiceAllocationsSync(
      documentType,
      documentId,
      companyId,
      tx,
    );

    // Also we need to ensure the settlements for these allocations are active and COMPLETED
    // But since this is foundational, we can sum directly or do a join
    // To be precise: sum allocations where settlement is COMPLETED

    let amountPaid = 0;
    for (const alloc of allocations) {
      const settlement = tx
        .select()
        .from(settlements)
        .where(eq(settlements.id, alloc.settlementId))
        .get();
      if (settlement && settlement.status === 'COMPLETED' && settlement.isActive) {
        amountPaid += alloc.allocatedAmount;
      }
    }

    const balanceDue = grandTotal - amountPaid;
    return { grandTotal, amountPaid, balanceDue, status };
  }

  private validateAndFetchDocumentBalanceSync(
    documentType: AllocationDocumentType,
    documentId: string,
    companyId: string,
    tx: TransactionExecutor,
  ) {
    return this.getDocumentBalanceSync(documentType, documentId, companyId, tx);
  }

  private updateDocumentStatusSync(
    documentType: AllocationDocumentType,
    documentId: string,
    companyId: string,
    tx: TransactionExecutor,
  ) {
    const { balanceDue, amountPaid } = this.getDocumentBalanceSync(
      documentType,
      documentId,
      companyId,
      tx,
    );

    let newStatus: InvoiceStatus;
    if (balanceDue <= 0) {
      newStatus = 'PAID';
    } else if (amountPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    } else {
      newStatus = 'SUBMITTED';
    }

    if (documentType === 'SALES_INVOICE') {
      this.salesInvoiceRepo.updateStatusSync(documentId, newStatus, tx);
    } else if (documentType === 'PURCHASE_BILL') {
      this.purchaseRepo.updateStatusSync(documentId, companyId, newStatus, tx);
    }
  }

  public async cancelSettlement(settlementId: string): Promise<{ cancelledSettlementId: string }> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return dbService.getDb().transaction((tx) => {
      const settlement = settlementRepository.getSettlementById(settlementId, companyId, tx);
      if (!settlement) {
        throw new Error(`Settlement ${settlementId} not found`);
      }

      if (settlement.status === 'CANCELLED') {
        throw new Error('Settlement is already cancelled');
      }

      if (settlement.status !== 'COMPLETED') {
        throw new Error(
          `Only COMPLETED settlements can be cancelled. Current status: ${settlement.status}`,
        );
      }

      // Mark settlement as cancelled
      tx.update(settlements)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(settlements.id, settlementId))
        .run();

      // Get allocations and trigger status recalculation
      const allocations = settlementRepository.getSettlementAllocationsSync(
        settlementId,
        companyId,
        tx,
      );
      for (const alloc of allocations) {
        this.updateDocumentStatusSync(alloc.documentType, alloc.documentId, companyId, tx);
      }

      // Cancel the voucher
      journalService.reverseSettlementVoucherSync(settlementId, tx);

      return { cancelledSettlementId: settlementId };
    });
  }

  public async getOutstandingDocuments(
    partyType: 'CUSTOMER' | 'SUPPLIER',
    partyId: string,
  ): Promise<import('@vyora/types').OutstandingDocumentDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return dbService.getDb().transaction((tx) => {
      const results: import('@vyora/types').OutstandingDocumentDto[] = [];

      if (partyType === 'CUSTOMER') {
        const invoices = tx
          .select()
          .from(sales_invoices)
          .where(
            and(eq(sales_invoices.companyId, companyId), eq(sales_invoices.customerId, partyId)),
          )
          .orderBy(sales_invoices.invoiceDate, sales_invoices.id)
          .all();

        for (const inv of invoices) {
          if (inv.status === 'DRAFT' || inv.status === 'CANCELLED') continue;
          const { balanceDue } = this.getDocumentBalanceSync(
            'SALES_INVOICE',
            inv.id,
            companyId,
            tx,
          );
          if (balanceDue > 0) {
            results.push({
              id: inv.id,
              documentNumber: inv.invoiceNumber,
              documentDate: inv.invoiceDate,
              grandTotal: inv.grandTotal,
              balanceDue,
              status: inv.status,
              documentType: 'SALES_INVOICE',
            });
          }
        }
      } else {
        const invoices = tx
          .select()
          .from(purchase_invoices)
          .where(
            and(
              eq(purchase_invoices.companyId, companyId),
              eq(purchase_invoices.supplierId, partyId),
            ),
          )
          .orderBy(purchase_invoices.purchaseDate, purchase_invoices.id)
          .all();

        for (const inv of invoices) {
          if (inv.status === 'DRAFT' || inv.status === 'CANCELLED') continue;
          const { balanceDue } = this.getDocumentBalanceSync(
            'PURCHASE_BILL',
            inv.id,
            companyId,
            tx,
          );
          if (balanceDue > 0) {
            results.push({
              id: inv.id,
              documentNumber: inv.purchaseNumber,
              documentDate: inv.purchaseDate,
              grandTotal: inv.grandTotal,
              balanceDue,
              status: inv.status,
              documentType: 'PURCHASE_BILL',
            });
          }
        }
      }

      return results;
    });
  }

  public async listSettlements(options: ListSettlementsOptions): Promise<SettlementListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    return settlementRepository.listSettlements({
      ...options,
      companyId,
    });
  }

  public async getSettlementById(id: string) {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context');

    const settlement = settlementRepository.getSettlementDtoById(id, companyId);
    if (!settlement) {
      throw new Error(`Settlement ${id} not found`);
    }

    return settlement;
  }
}

export const settlementService = new SettlementService();
