import * as fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';
import { app } from 'electron';

import { loggerService } from '../logger/LoggerService';

import { directoryDatabaseService } from './DirectoryDatabaseService';
import { directoryManagerDatabaseService } from './DirectoryManagerDatabaseService';

export class DirectorySwapService {
  /**
   * Validates a candidate database file before swap
   */
  public async validateCandidateDatabase(absolutePath: string): Promise<boolean> {
    loggerService.info(`[DirectorySwapService] Validating candidate DB at ${absolutePath}`);

    // 1. File exists
    if (!fs.existsSync(absolutePath)) {
      loggerService.error(`[DirectorySwapService] Candidate DB does not exist: ${absolutePath}`);
      return false;
    }

    let tempDb: Database.Database | null = null;
    try {
      // 2. SQLite can open
      tempDb = new Database(absolutePath, { readonly: true });

      // 3. Required tables exist (pincode_master)
      const tableCheck = tempDb
        .prepare(
          `
        SELECT name FROM sqlite_master WHERE type='table' AND name='pincode_master'
      `,
        )
        .get();

      if (!tableCheck) {
        loggerService.error(
          `[DirectorySwapService] Validation failed: pincode_master table missing`,
        );
        return false;
      }

      // 4. Basic query succeeds
      tempDb.prepare(`SELECT 1 FROM pincode_master LIMIT 1`).get();

      // Basic query ran without throwing an error
      return true;
    } catch (e) {
      loggerService.error(`[DirectorySwapService] Validation failed with SQLite error:`, e);
      return false;
    } finally {
      if (tempDb) {
        tempDb.close();
      }
    }
  }

  /**
   * Executes the Blue/Green Swap safely
   * @param fileName The new database filename inside the resources directory (e.g. 'directories_v2.db')
   */
  public async swap(fileName: string): Promise<boolean> {
    const isDev = !app?.isPackaged;
    // Base dir resolution depends on where resources are. Assuming same as manager
    const baseDir = isDev
      ? path.join(__dirname, '../resources')
      : path.join(process.resourcesPath || '', 'resources');

    const newAbsolutePath = path.join(baseDir, fileName);

    const isValid = await this.validateCandidateDatabase(newAbsolutePath);
    if (!isValid) {
      loggerService.error(
        `[DirectorySwapService] Swap aborted: Invalid candidate database ${fileName}`,
      );
      return false;
    }

    try {
      const currentActive = await directoryManagerDatabaseService.getActiveDirectoryDatabase();
      if (currentActive) {
        loggerService.info(`[DirectorySwapService] Setting last known good DB to ${currentActive}`);
        await directoryManagerDatabaseService.setLastKnownGoodDatabase(currentActive);
      }

      loggerService.info(`[DirectorySwapService] Setting active DB to ${fileName}`);
      await directoryManagerDatabaseService.setActiveDirectoryDatabase(fileName);

      loggerService.info(
        `[DirectorySwapService] Reloading database connection to ${newAbsolutePath}`,
      );
      await directoryDatabaseService.reload(newAbsolutePath);

      loggerService.info(`[DirectorySwapService] Swap successful`);
      return true;
    } catch (e) {
      loggerService.error(`[DirectorySwapService] Swap failed during pointer transition:`, e);
      return false;
    }
  }

  /**
   * Rolls back to the last known good database
   */
  public async rollback(): Promise<boolean> {
    const lastKnownGood = await directoryManagerDatabaseService.getLastKnownGoodDatabase();
    if (!lastKnownGood) {
      loggerService.error(
        `[DirectorySwapService] Rollback aborted: No last known good database found`,
      );
      return false;
    }

    const isDev = !app?.isPackaged;
    const baseDir = isDev
      ? path.join(__dirname, '../resources')
      : path.join(process.resourcesPath || '', 'resources');

    const rollbackPath = path.join(baseDir, lastKnownGood);

    if (!fs.existsSync(rollbackPath)) {
      loggerService.error(
        `[DirectorySwapService] Rollback aborted: Last known good database file is missing from disk`,
      );
      return false;
    }

    try {
      loggerService.info(`[DirectorySwapService] Restoring active DB to ${lastKnownGood}`);
      await directoryManagerDatabaseService.setActiveDirectoryDatabase(lastKnownGood);

      loggerService.info(`[DirectorySwapService] Reloading database connection to ${rollbackPath}`);
      await directoryDatabaseService.reload(rollbackPath);

      loggerService.info(`[DirectorySwapService] Rollback successful`);
      return true;
    } catch (e) {
      loggerService.error(`[DirectorySwapService] Rollback failed during pointer transition:`, e);
      return false;
    }
  }
}

export const directorySwapService = new DirectorySwapService();
