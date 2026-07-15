import * as fs from 'fs';
import * as path from 'path';

import { VyoraDatabase, seedDatabase } from '@vyora/database';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';

import { IDatabaseAdapter } from '../../main/database/adapters/IDatabaseAdapter';
import { DatabaseAdapterFactory } from '../../main/database/DatabaseAdapterFactory';
import { DEFAULT_DATABASE_ENGINE } from '../../main/database/DatabaseEngine';
import { databaseMigrationService } from '../../main/database/migration/DatabaseMigrationService';
import { companyStorageService } from '../../main/security/CompanyStorageService';
import { loggerService } from '../logger/LoggerService';

export class DatabaseService {
  private adapter: IDatabaseAdapter;
  private dbPath: string;
  private migrationsFolder: string;

  constructor() {
    this.dbPath =
      process.env.VYORA_DB_PATH || companyStorageService.getCompanyDatabasePath('vyora');
    const dbDir = path.dirname(this.dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Engine is selected asynchronously during init(), but we set a default here.
    this.adapter = DatabaseAdapterFactory.createAdapter(DEFAULT_DATABASE_ENGINE);

    // Resolve migrations folder.
    // In dev, it might be in packages/database/drizzle
    // In production, it might need to be copied to resources/assets.
    // For now, we'll try to find it in the workspace during dev.
    const isDev = !app.isPackaged;
    if (isDev) {
      this.migrationsFolder = path.join(__dirname, '../../../packages/database/drizzle');
    } else {
      this.migrationsFolder = path.join(process.resourcesPath, 'assets/drizzle');
    }
  }

  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    loggerService.info(`[DatabaseService] Initializing database at ${this.dbPath}`);

    try {
      // Synchronous state check is removed in favor of full migration pipeline.
      // If migration is required, the encryption migration service will perform it now.
      if (databaseMigrationService.requiresMigration(this.dbPath)) {
        const { databaseEncryptionMigrationService } =
          await import('../../main/database/migration/DatabaseEncryptionMigrationService');
        await databaseEncryptionMigrationService.runMigration(this.dbPath);

        // Important: After successful migration, the original .db file is renamed.
        // We must fetch the new path (.vyr) from the storage service, unless overridden by env.
        this.dbPath =
          process.env.VYORA_DB_PATH || companyStorageService.getCompanyDatabasePath('vyora');
      }

      // Engine is now always SQLCIPHER
      const engine = databaseMigrationService.getRecommendedEngine(this.dbPath);
      this.adapter = DatabaseAdapterFactory.createAdapter(engine);

      await this.adapter.connect(this.dbPath);

      // Run migrations
      if (fs.existsSync(this.migrationsFolder)) {
        loggerService.info(`[DatabaseService] Running migrations from ${this.migrationsFolder}...`);
        migrate(this.adapter.getDb(), { migrationsFolder: this.migrationsFolder });
        loggerService.info(`[DatabaseService] Migrations applied successfully.`);
      } else {
        loggerService.warn(
          `[DatabaseService] Migrations folder not found at ${this.migrationsFolder}`,
        );
      }

      // Run seed
      await seedDatabase(this.adapter.getDb());

      this.initialized = true;
      loggerService.info(`[DatabaseService] Initialization complete.`);
    } catch (error) {
      loggerService.error('[DatabaseService] Initialization failed:', error);
      throw error;
    }
  }

  public getDb(): VyoraDatabase {
    return this.adapter.getDb();
  }
}

export const dbService = new DatabaseService();
