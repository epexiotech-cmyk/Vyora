import { existsSync, statSync } from 'fs';
import path from 'path';

import { document_numbering_sequences } from '@vyora/database';
import { sql } from 'drizzle-orm';
import { app } from 'electron';

import { inventoryAdminService, IntegrityMismatch } from './admin/InventoryAdminService';
import { transactionResetService } from './admin/TransactionResetService';
import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { financialYearContextService } from './FinancialYearContextService';

export interface DiagnosticsInfo {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
  databasePath: string;
  databaseSizeBytes: number;
  activeCompanyId: string | null;
  activeFinancialYearId: string | null;
  tableCounts: Record<string, number>;
}

export interface FactoryResetSummary {
  deletedCounts: Record<string, number>;
  executionTimeMs: number;
}

export class DeveloperToolsService {
  private getTableCount(tableName: string): number {
    const db = dbService.getDb();
    // Use raw query for fast count
    const result = db.get<{ count: number }>(
      sql`SELECT count(*) as count FROM ${sql.identifier(tableName)}`,
    );
    return result?.count || 0;
  }

  public async getDiagnostics(): Promise<DiagnosticsInfo> {
    const dbPath = path.join(app.getPath('userData'), 'database', 'vyora.vyr');
    let dbSize = 0;
    if (existsSync(dbPath)) {
      dbSize = statSync(dbPath).size;
    }

    const tableCounts = {
      settlement_allocations: this.getTableCount('settlement_allocations'),
      settlements: this.getTableCount('settlements'),
      voucher_entries: this.getTableCount('voucher_entries'),
      vouchers: this.getTableCount('vouchers'),
      sales_invoice_items: this.getTableCount('sales_invoice_items'),
      sales_invoices: this.getTableCount('sales_invoices'),
      purchase_invoice_items: this.getTableCount('purchase_invoice_items'),
      purchase_invoices: this.getTableCount('purchase_invoices'),
      stock_movements: this.getTableCount('stock_movements'),
      inventory_balances: this.getTableCount('inventory_balances'),
      document_numbering_sequences: this.getTableCount('document_numbering_sequences'),
    };

    return {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      databasePath: dbPath,
      databaseSizeBytes: dbSize,
      activeCompanyId: companyContextService.getActiveCompany(),
      activeFinancialYearId: financialYearContextService.getActiveFinancialYear()?.id || null,
      tableCounts,
    };
  }

  public async dryRunFactoryReset(): Promise<Record<string, number>> {
    const diagnostics = await this.getDiagnostics();
    return diagnostics.tableCounts;
  }

  public async executeFactoryReset(): Promise<FactoryResetSummary> {
    const start = Date.now();

    // Capture counts before deletion to report what was deleted
    const deletedCounts = await this.dryRunFactoryReset();

    await transactionResetService.hardResetAllSync();

    const executionTimeMs = Date.now() - start;

    return {
      deletedCounts,
      executionTimeMs,
    };
  }

  public async checkInventoryIntegrity(): Promise<IntegrityMismatch[]> {
    return await inventoryAdminService.checkInventoryIntegritySync();
  }

  public async rebuildInventory(): Promise<void> {
    await inventoryAdminService.rebuildInventorySync();
  }

  public async resetDocumentNumberingSequences(): Promise<void> {
    const db = dbService.getDb();
    db.delete(document_numbering_sequences).run();
  }
}

export const developerToolsService = new DeveloperToolsService();
