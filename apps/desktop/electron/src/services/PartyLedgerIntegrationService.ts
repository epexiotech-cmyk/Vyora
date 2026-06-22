import { randomUUID } from 'crypto';

import { ledgers, ledger_groups, InsertLedger } from '@vyora/database';
import { CustomerProfileDto, SupplierProfileDto } from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { TransactionExecutor } from '../repositories/BaseRepository';

export class PartyLedgerIntegrationService {
  /**
   * Helper to find a system group by its hardcoded name in the DB.
   */
  private getSystemGroupSync(companyId: string, groupName: string, tx: TransactionExecutor) {
    const group = tx
      .select()
      .from(ledger_groups)
      .where(and(eq(ledger_groups.companyId, companyId), eq(ledger_groups.name, groupName)))
      .get();

    if (!group) {
      throw new Error(`System Group '${groupName}' not found. Seeding may have failed.`);
    }
    return group;
  }

  public createCustomerLedgerSync(
    companyId: string,
    customer: CustomerProfileDto,
    tx: TransactionExecutor,
  ): void {
    const debtorsGroup = this.getSystemGroupSync(companyId, 'Sundry Debtors', tx);

    const newLedger: InsertLedger = {
      id: randomUUID(),
      companyId,
      groupId: debtorsGroup.id,
      name: `${customer.name} (${customer.customerCode})`,
      referenceType: 'CUSTOMER',
      referenceId: customer.id,
      isSystemAccount: false,
      allowManualPosting: true,
      isFrozen: !customer.isActive,
      openingBalance: customer.openingBalance,
      openingType: (customer.openingType as 'Dr' | 'Cr') || 'Dr',
      isActive: true,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tx.insert(ledgers).values(newLedger).run();
  }

  public createSupplierLedgerSync(
    companyId: string,
    supplier: SupplierProfileDto,
    tx: TransactionExecutor,
  ): void {
    const creditorsGroup = this.getSystemGroupSync(companyId, 'Sundry Creditors', tx);

    const newLedger: InsertLedger = {
      id: randomUUID(),
      companyId,
      groupId: creditorsGroup.id,
      name: `${supplier.name} (${supplier.supplierCode})`,
      referenceType: 'SUPPLIER',
      referenceId: supplier.id,
      isSystemAccount: false,
      allowManualPosting: true,
      isFrozen: !supplier.isActive,
      openingBalance: supplier.openingBalance,
      openingType: (supplier.openingType as 'Dr' | 'Cr') || 'Dr',
      isActive: true,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tx.insert(ledgers).values(newLedger).run();
  }

  public syncPartyLedgerSync(
    companyId: string,
    partyId: string,
    referenceType: 'CUSTOMER' | 'SUPPLIER',
    isActive: boolean,
    tx: TransactionExecutor,
  ): void {
    // Phase 7.1.3A.2 Option B: Name and Code are NOT synced after creation.
    // We only sync the isFrozen status when a master record is activated/deactivated.

    const existingLedger = tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId, companyId),
          eq(ledgers.referenceType, referenceType),
          eq(ledgers.referenceId, partyId),
        ),
      )
      .get();

    if (!existingLedger) {
      // It's possible the record is old and didn't get a ledger, but we throw for now
      // since the system guarantees creation.
      throw new Error(`Ledger not found for ${referenceType} ${partyId}`);
    }

    tx.update(ledgers)
      .set({
        isFrozen: !isActive,
        updatedAt: new Date(),
        syncVersion: existingLedger.syncVersion + 1,
      })
      .where(eq(ledgers.id, existingLedger.id))
      .run();
  }
}

export const partyLedgerIntegrationService = new PartyLedgerIntegrationService();
