import * as fs from 'fs';
import * as path from 'path';

import { app, nativeTheme } from 'electron';

import { DbTransaction } from '../../main/database/adapters/IDatabaseAdapter';
import { dbService } from '../database/DatabaseService';
import { fileSystemService } from '../filesystem/FileSystemService';
import { loggerService } from '../logger/LoggerService';
import { settingsService } from '../settings/SettingsService';

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
  SettingsResetProvider,
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
  private settingsProvider = new SettingsResetProvider();
  private coreSystemProvider = new CoreSystemResetProvider();

  public async executeFullReset(): Promise<FactoryResetReport> {
    loggerService.info('[FactoryResetService] Starting full application reset...');
    loggerService.info('[FactoryReset] Step 1 - Begin transaction');
    const startTime = Date.now();
    const db = dbService.getDb();

    let combinedCounts: Record<string, number> = {};

    // 1. Delete all database records inside a transaction
    db.transaction((tx: DbTransaction) => {
      // Topologically safe order: Transactions -> Master Data -> Auth -> Core System
      loggerService.info('[FactoryReset] Step 2 - settlementProvider');
      const p1 = this.settlementProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 2 Complete');

      loggerService.info('[FactoryReset] Step 3 - accountingProvider');
      const p2 = this.accountingProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 3 Complete');

      loggerService.info('[FactoryReset] Step 4 - salesProvider');
      const p3 = this.salesProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 4 Complete');

      loggerService.info('[FactoryReset] Step 5 - purchasesProvider');
      const p4 = this.purchasesProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 5 Complete');

      loggerService.info('[FactoryReset] Step 6 - inventoryProvider');
      const p5 = this.inventoryProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 6 Complete');

      loggerService.info('[FactoryReset] Step 7 - docNumberingProvider');
      const p6 = this.docNumberingProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 7 Complete');

      loggerService.info('[FactoryReset] Step 8 - masterDataProvider');
      const p7 = this.masterDataProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 8 Complete');

      loggerService.info('[FactoryReset] Step 9 - authProvider');
      const p8 = this.authProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 9 Complete');

      loggerService.info('[FactoryReset] Step 10 - settingsProvider');
      const p9 = this.settingsProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 10 Complete');

      loggerService.info('[FactoryReset] Step 11 - coreSystemProvider');
      const p10 = this.coreSystemProvider.reset(tx);
      loggerService.info('[FactoryReset] Step 11 Complete');

      combinedCounts = { ...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9, ...p10 };
    });

    loggerService.info('[FactoryReset] Step 1 Complete');
    loggerService.info('[FactoryResetService] Database records cleared.');

    loggerService.info('[FactoryReset] Step 11 - Cleanup attachments');
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
    loggerService.info('[FactoryReset] Step 11 Complete');

    const executionDurationMs = Date.now() - startTime;
    const report: FactoryResetReport = {
      recordsRemoved: combinedCounts,
      filesRemoved,
      executionDurationMs,
    };

    loggerService.info('[FactoryResetService] Factory Reset Execution Report:', report);

    // 3. Reset Global Application Appearance
    settingsService.set('appearance', { theme: 'system' });
    nativeTheme.themeSource = 'system';
    loggerService.info('[FactoryResetService] Appearance reset to system.');

    // 4. Relaunch and exit
    loggerService.info('[FactoryReset] Step 12 - app.relaunch()');
    loggerService.info('[FactoryResetService] Triggering application restart...');
    app.relaunch();
    app.exit(0);
    loggerService.info('[FactoryReset] Step 12 Complete');

    return report; // Code execution practically ends at app.exit, but TS needs return
  }
}

export const factoryResetService = new FactoryResetService();
