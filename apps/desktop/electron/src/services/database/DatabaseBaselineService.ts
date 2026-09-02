import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { VyoraDatabase } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { loggerService } from '../logger/LoggerService';

export class DatabaseBaselineService {
  public async ensureBaseline(db: VyoraDatabase, migrationsFolder: string): Promise<void> {
    const baselineFile = path.join(migrationsFolder, '0000_late_mathemanic.sql');
    if (!fs.existsSync(baselineFile)) {
      loggerService.warn(`[DatabaseBaselineService] Baseline file not found: ${baselineFile}`);
      return;
    }

    let migrationsTableExists = false;
    try {
      const result = db.get<{ name: string }>(
        sql`SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'`,
      );
      migrationsTableExists = !!result;
    } catch {
      // Table might not exist or other error
    }

    if (!migrationsTableExists) {
      loggerService.info(
        '[DatabaseBaselineService] __drizzle_migrations does not exist. Brand new database.',
      );
      return;
    }

    const migrationRows = db.all<{ id: number; hash: string; created_at: number }>(
      sql`SELECT * FROM __drizzle_migrations`,
    );

    if (migrationRows.length === 0) {
      loggerService.info(
        '[DatabaseBaselineService] __drizzle_migrations is empty. Brand new database.',
      );
      return;
    }

    const sqlContent = fs.readFileSync(baselineFile, 'utf8');
    const baselineHash = crypto.createHash('sha256').update(sqlContent).digest('hex');

    const hasBaseline = migrationRows.some((row) => row.hash === baselineHash);
    if (hasBaseline) {
      loggerService.info('[DatabaseBaselineService] Database already on current baseline.');
      return;
    }

    loggerService.info(
      `[DatabaseBaselineService] Legacy database detected (Rows: ${migrationRows.length}). Verifying schema compatibility...`,
    );

    // Parse tables from baseline file
    const tables: string[] = [];
    const tableRegex = /CREATE TABLE `([^`]+)` \([\s\S]*?\);/g;
    let match;
    while ((match = tableRegex.exec(sqlContent)) !== null) {
      tables.push(match[1]);
    }

    // Check tables in db
    const dbTables = db
      .all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type='table'`)
      .map((row) => row.name);

    const missingTables = tables.filter((t) => !dbTables.includes(t));
    if (missingTables.length > 0) {
      loggerService.error(
        `[DatabaseBaselineService] Incompatible schema. Missing tables: ${missingTables.join(', ')}`,
      );
      return; // Do not apply baseline transition, let Drizzle fail natively
    }

    loggerService.info(
      `[DatabaseBaselineService] Schema verification passed. Transitioning metadata to baseline hash: ${baselineHash}`,
    );

    db.transaction((tx) => {
      tx.run(sql`DELETE FROM __drizzle_migrations`);
      tx.run(
        sql`INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (1, ${baselineHash}, ${Date.now()})`,
      );
    });

    loggerService.info('[DatabaseBaselineService] Baseline transition successful.');
  }
}

export const databaseBaselineService = new DatabaseBaselineService();
