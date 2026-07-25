import * as fs from 'fs';
import * as path from 'path';

import { app } from 'electron';

import { DbTransaction } from '../../main/database/adapters/IDatabaseAdapter';
import { dbService } from '../database/DatabaseService';
import { fileSystemService } from '../filesystem/FileSystemService';
import { loggerService } from '../logger/LoggerService';

import {
  AccountingResetProvider,
  AuthResetProvider,
  CoreSystemResetProvider,
  DocumentNumberingResetProvider,
  InventoryResetProvider,
  MasterDataResetProvider,
  PurchasesResetProvider,
  SalesResetProvider,
  SettlementResetProvider,
} from './reset';

export interface FactoryResetReport {
  recordsRemoved: Record<string, number>;
  filesRemoved: number;
  executionDurationMs: number;
}

export class FactoryResetService {
  private settlementProvider = new SettlementResetProvider();
  private accountingProvider = new AccountingResetProvider();
  private salesProvider = new SalesResetProvider();
  private purchasesProvider = new PurchasesResetProvider();
  private inventoryProvider = new InventoryResetProvider();
  private docNumberingProvider = new DocumentNumberingResetProvider();
  private masterDataProvider = new MasterDataResetProvider();
  private authProvider = new AuthResetProvider();
  private coreSystemProvider = new CoreSystemResetProvider();

  public async executeFullReset(): Promise<FactoryResetReport> {
    loggerService.info('[FactoryResetService] Starting full application reset...');
    const startTime = Date.now();
    const db = dbService.getDb();

    let combinedCounts: Record<string, number> = {};

    // 1. Delete all database records inside a transaction
    db.transaction((tx: DbTransaction) => {
      // Topologically safe order: Transactions -> Master Data -> Auth -> Core System
      const p1 = this.settlementProvider.reset(tx);
      const p2 = this.accountingProvider.reset(tx);
      const p3 = this.salesProvider.reset(tx);
      const p4 = this.purchasesProvider.reset(tx);
      const p5 = this.inventoryProvider.reset(tx);
      const p6 = this.docNumberingProvider.reset(tx);
      const p7 = this.masterDataProvider.reset(tx);
      const p8 = this.authProvider.reset(tx);
      const p9 = this.coreSystemProvider.reset(tx);

      combinedCounts = { ...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9 };
    });

    loggerService.info('[FactoryResetService] Database records cleared.');

    // 2. Clear user-generated files
    let filesRemoved = 0;
    const dirsToClear = [
      fileSystemService.getPath('attachments'),
      fileSystemService.getPath('exports'),
    ];

    for (const dir of dirsToClear) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              filesRemoved++;
            }
          }
        } catch (err) {
          loggerService.error(`[FactoryResetService] Failed to clear directory ${dir}:`, err);
        }
      }
    }

    const executionDurationMs = Date.now() - startTime;
    const report: FactoryResetReport = {
      recordsRemoved: combinedCounts,
      filesRemoved,
      executionDurationMs,
    };

    loggerService.info('[FactoryResetService] Factory Reset Execution Report:', report);

    // 3. Relaunch and exit
    loggerService.info('[FactoryResetService] Triggering application restart...');
    app.relaunch();
    app.exit(0);

    return report; // Code execution practically ends at app.exit, but TS needs return
  }
}

export const factoryResetService = new FactoryResetService();
