import * as fs from 'fs';
import * as path from 'path';

import { initializeDatabase, VyoraDatabase, seedDatabase } from '@vyora/database';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';

import { loggerService } from '../logger/LoggerService';

export class DatabaseService {
  private db: VyoraDatabase | null = null;
  private dbPath: string;
  private migrationsFolder: string;

  constructor() {
    // Determine user data path (e.g. AppData/Roaming/Vyora on Windows)
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'vyora.db');

    // Resolve migrations folder.
    // In dev, it might be in packages/database/drizzle
    // In production, it might need to be copied to resources/assets.
    // For now, we'll try to find it in the workspace during dev.
    const isDev = !app.isPackaged;
    if (isDev) {
      this.migrationsFolder = path.join(__dirname, '../../../../packages/database/drizzle');
    } else {
      this.migrationsFolder = path.join(process.resourcesPath, 'assets/drizzle');
    }
  }

  public async init(): Promise<void> {
    loggerService.info(`[DatabaseService] Initializing at ${this.dbPath}`);
    try {
      const { db } = initializeDatabase(this.dbPath);
      this.db = db;

      // Run migrations
      if (fs.existsSync(this.migrationsFolder)) {
        loggerService.info(`[DatabaseService] Running migrations from ${this.migrationsFolder}...`);
        migrate(this.db, { migrationsFolder: this.migrationsFolder });
        loggerService.info(`[DatabaseService] Migrations applied successfully.`);
      } else {
        loggerService.warn(
          `[DatabaseService] Migrations folder not found at ${this.migrationsFolder}`,
        );
      }

      // Run seed
      await seedDatabase(this.db);

      loggerService.info(`[DatabaseService] Initialization complete.`);
    } catch (error) {
      loggerService.error('[DatabaseService] Initialization failed:', error);
      throw error;
    }
  }

  public getDb(): VyoraDatabase {
    if (!this.db) {
      throw new Error('Database is not initialized. Call init() first.');
    }
    return this.db;
  }
}

export const dbService = new DatabaseService();
