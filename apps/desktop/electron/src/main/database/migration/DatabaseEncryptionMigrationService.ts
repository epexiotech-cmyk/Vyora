import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import Database from 'better-sqlite3-multiple-ciphers';

import { loggerService } from '../../../services/logger/LoggerService';
import { keyManagementService } from '../../security/KeyManagementService';

import { databaseMigrationService } from './DatabaseMigrationService';

export interface DatabaseMetrics {
  integrityOk: boolean;
  quickCheckOk: boolean;
  schemaHash: string;
  tableCount: number;
  rowCounts: Record<string, number>;
}

export interface MigrationPlan {
  sourceDbPath: string;
  targetDbPath: string;
  sourceSize: number;
  backupPath: string;
  migrationRequired: boolean;
  encryptionKeyAvailable: boolean;
  sourceHash?: string;
  backupHash?: string;
  metrics?: DatabaseMetrics;
}

export interface MigrationReport {
  ready: boolean;
  checks: string[];
  warnings: string[];
  errors: string[];
}

export class DatabaseEncryptionMigrationService {
  private calculateFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) return '';
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  private extractDatabaseMetrics(dbPath: string, key?: string): DatabaseMetrics {
    const db = new Database(dbPath, { readonly: true });
    try {
      if (key) {
        // Safely escape single quotes in the encryption key
        const escapedKey = key.replace(/'/g, "''");
        db.pragma(`key = '${escapedKey}'`);
        db.pragma('cipher_compatibility = 4');
        db.pragma('kdf_iter = 256000');
        db.pragma('cipher_use_hmac = OFF');
        db.pragma('cipher_page_size = 4096');
      }

      // Check Integrity
      const integrity = db.pragma('integrity_check', { simple: true });
      const integrityOk =
        integrity === 'ok' || (Array.isArray(integrity) && integrity[0]?.integrity_check === 'ok');

      // Check Quick
      const quick = db.pragma('quick_check', { simple: true });
      const quickCheckOk =
        quick === 'ok' || (Array.isArray(quick) && quick[0]?.quick_check === 'ok');

      // Get schema hash
      const schemas = db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as { sql: string }[];
      const combinedSchema = schemas.map((s) => s.sql).join(';');
      const schemaHash = crypto.createHash('sha256').update(combinedSchema).digest('hex');

      // Get tables and row counts
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      const rowCounts: Record<string, number> = {};
      for (const t of tables) {
        const result = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get() as { c: number };
        rowCounts[t.name] = result.c;
      }

      return {
        integrityOk,
        quickCheckOk,
        schemaHash,
        tableCount: tables.length,
        rowCounts,
      };
    } finally {
      db.close();
    }
  }

  public async generateMigrationPlan(sourceDbPath: string): Promise<MigrationPlan> {
    const parsed = path.parse(sourceDbPath);
    const backupPath = path.join(parsed.dir, `${parsed.name}.pre-encryption.db`);

    // Target is vyora.vyr
    const targetDbPath = path.join(parsed.dir, `${parsed.name}.vyr`);

    let sourceSize = 0;
    if (fs.existsSync(sourceDbPath)) {
      sourceSize = fs.statSync(sourceDbPath).size;
    }

    const migrationRequired = databaseMigrationService.requiresMigration(sourceDbPath);
    const key = await keyManagementService.ensureMasterKey();

    let metrics: DatabaseMetrics | undefined;
    let sourceHash: string | undefined;

    if (migrationRequired && fs.existsSync(sourceDbPath)) {
      metrics = this.extractDatabaseMetrics(sourceDbPath);
      sourceHash = this.calculateFileHash(sourceDbPath);
    }

    return {
      sourceDbPath,
      targetDbPath,
      sourceSize,
      backupPath,
      migrationRequired,
      encryptionKeyAvailable: !!key,
      sourceHash,
      metrics,
    };
  }

  public async validateMigrationReadiness(plan: MigrationPlan): Promise<MigrationReport> {
    const report: MigrationReport = {
      ready: true,
      checks: [],
      warnings: [],
      errors: [],
    };

    // Check 1: Database exists
    if (fs.existsSync(plan.sourceDbPath)) {
      report.checks.push('Source database exists.');
    } else {
      report.errors.push('Source database does not exist.');
      report.ready = false;
    }

    // Check 2: Database readable
    try {
      fs.accessSync(plan.sourceDbPath, fs.constants.R_OK);
      report.checks.push('Source database is readable.');
    } catch {
      report.errors.push('Source database is not readable.');
      report.ready = false;
    }

    // Check 3: Encryption key exists
    if (plan.encryptionKeyAvailable) {
      report.checks.push('Encryption key is available.');
    } else {
      report.errors.push('Master encryption key is missing.');
      report.ready = false;
    }

    // Check 4: Backup location writable
    try {
      const backupDir = path.dirname(plan.backupPath);
      fs.accessSync(backupDir, fs.constants.W_OK);
      report.checks.push('Backup location directory is writable.');
    } catch {
      report.errors.push('Backup location directory is not writable.');
      report.ready = false;
    }

    // Check 5: Target location writable
    try {
      const targetDir = path.dirname(plan.targetDbPath);
      fs.accessSync(targetDir, fs.constants.W_OK);
      report.checks.push('Target location directory is writable.');
    } catch {
      report.errors.push('Target location directory is not writable.');
      report.ready = false;
    }

    if (!plan.migrationRequired) {
      report.warnings.push(
        'Migration is not required for this database (already encrypted or missing).',
      );
    }

    return report;
  }

  public async createBackup(plan: MigrationPlan): Promise<void> {
    loggerService.info(`[EncryptionMigration] Creating backup at ${plan.backupPath}`);
    fs.copyFileSync(plan.sourceDbPath, plan.backupPath);
    plan.backupHash = this.calculateFileHash(plan.backupPath);
  }

  public async verifyBackup(plan: MigrationPlan): Promise<boolean> {
    loggerService.info(`[EncryptionMigration] Verifying backup at ${plan.backupPath}`);
    if (!plan.sourceHash || !plan.backupHash) return false;
    return plan.sourceHash === plan.backupHash;
  }

  public async executeMigration(plan: MigrationPlan, key: string): Promise<void> {
    loggerService.info(`[EncryptionMigration] Executing PRAGMA rekey to ${plan.targetDbPath}`);

    // Copy the original database to the target location to act as the base
    fs.copyFileSync(plan.sourceDbPath, plan.targetDbPath);

    // Open the target unencrypted
    const db = new Database(plan.targetDbPath);
    try {
      // Safely escape single quotes in the encryption key
      const escapedKey = key.replace(/'/g, "''");
      db.pragma(`rekey = '${escapedKey}'`);
    } finally {
      // Closing immediately commits the rekey operation to disk
      db.close();
    }
  }

  public async verifyMigration(plan: MigrationPlan, key: string): Promise<boolean> {
    loggerService.info(`[EncryptionMigration] Verifying encrypted database metrics`);
    if (!plan.metrics) return false;

    const targetMetrics = this.extractDatabaseMetrics(plan.targetDbPath, key);

    if (!targetMetrics.integrityOk || !targetMetrics.quickCheckOk) {
      loggerService.error('[EncryptionMigration] Target database failed integrity checks');
      return false;
    }

    if (plan.metrics.schemaHash !== targetMetrics.schemaHash) {
      loggerService.error('[EncryptionMigration] Schema hash mismatch');
      return false;
    }

    if (plan.metrics.tableCount !== targetMetrics.tableCount) {
      loggerService.error('[EncryptionMigration] Table count mismatch');
      return false;
    }

    for (const [table, count] of Object.entries(plan.metrics.rowCounts)) {
      if (targetMetrics.rowCounts[table] !== count) {
        loggerService.error(`[EncryptionMigration] Row count mismatch on table ${table}`);
        return false;
      }
    }

    return true;
  }

  public async finalizeMigration(plan: MigrationPlan): Promise<void> {
    loggerService.info(`[EncryptionMigration] Finalizing migration`);
    // Rename original database to .pre-encryption.db (overwrite the backup we created)
    fs.renameSync(plan.sourceDbPath, plan.backupPath);

    // Write migration metadata
    const parsed = path.parse(plan.sourceDbPath);
    const infoPath = path.join(parsed.dir, 'migration-info.json');
    const info = {
      migrationVersion: 1,
      timestamp: new Date().toISOString(),
      sourceDatabase: parsed.base,
      targetDatabase: path.parse(plan.targetDbPath).base,
      sourceHash: plan.sourceHash,
      backupHash: plan.backupHash,
      sourceTableCount: plan.metrics?.tableCount,
      targetTableCount: plan.metrics?.tableCount,
      migrationSucceeded: true,
    };
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
    loggerService.info(`[EncryptionMigration] Migration metadata written to ${infoPath}`);
  }

  public async runMigration(sourceDbPath: string): Promise<void> {
    loggerService.info(`[EncryptionMigration] Starting FULL MIGRATION for ${sourceDbPath}`);

    const plan = await this.generateMigrationPlan(sourceDbPath);
    if (!plan.migrationRequired) {
      loggerService.info('[EncryptionMigration] No migration required.');
      return;
    }

    const report = await this.validateMigrationReadiness(plan);
    if (!report.ready) {
      throw new Error(
        `[EncryptionMigration] System not ready for migration: ${report.errors.join(', ')}`,
      );
    }

    const key = await keyManagementService.ensureMasterKey();
    if (!key) throw new Error('Master key missing.');

    if (!plan.metrics?.integrityOk || !plan.metrics?.quickCheckOk) {
      throw new Error(
        `[EncryptionMigration] Source database failed integrity checks. Cannot migrate.`,
      );
    }

    await this.createBackup(plan);
    const backupValid = await this.verifyBackup(plan);
    if (!backupValid) {
      throw new Error(`[EncryptionMigration] Backup checksum validation failed (Hash mismatch).`);
    }

    try {
      await this.executeMigration(plan, key);
      const migrationValid = await this.verifyMigration(plan, key);
      if (!migrationValid) {
        throw new Error(`[EncryptionMigration] Post-migration metrics validation failed.`);
      }

      await this.finalizeMigration(plan);
      loggerService.info(`[EncryptionMigration] MIGRATION SUCCESSFUL.`);
    } catch (e) {
      loggerService.error(`[EncryptionMigration] Migration failed:`, e);
      // Clean up target encrypted file if it exists, leave the source alone
      if (fs.existsSync(plan.targetDbPath)) {
        fs.unlinkSync(plan.targetDbPath);
      }
      throw e;
    }
  }

  public async runMigrationDryRun(sourceDbPath: string): Promise<MigrationReport> {
    loggerService.info(`[EncryptionMigration] Starting DRY RUN for ${sourceDbPath}`);

    const plan = await this.generateMigrationPlan(sourceDbPath);
    loggerService.info(`[EncryptionMigration] Generated Plan:`, plan);

    const report = await this.validateMigrationReadiness(plan);
    loggerService.info(`[EncryptionMigration] Validation Report:`, report);

    if (report.ready) {
      loggerService.info('[EncryptionMigration] DRY RUN: System is ready for migration.');
    } else {
      loggerService.error('[EncryptionMigration] DRY RUN: System is NOT ready for migration.');
    }

    return report;
  }
}

export const databaseEncryptionMigrationService = new DatabaseEncryptionMigrationService();
