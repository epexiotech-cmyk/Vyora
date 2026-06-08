import * as fs from 'fs';
import * as path from 'path';

import { VyoraDatabase, directorySettings } from '@vyora/database';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';

import { loggerService } from '../logger/LoggerService';

export class DirectoryManagerDatabaseService {
  private readonly EXPECTED_REGISTRY = [
    'pincode',
    'country',
    'currency',
    'state',
    'uqc',
    'hsn',
    'sac',
  ];
  private readonly TARGET_VERSION = 5;
  private dbInstance: VyoraDatabase | null = null;
  private sqliteInstance: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const isDev = !app.isPackaged;
    if (isDev) {
      this.dbPath = path.join(__dirname, '../../resources/directory-manager.db');
    } else {
      this.dbPath = path.join(process.resourcesPath, 'resources/directory-manager.db');
    }
  }

  public init(): void {
    if (this.dbInstance) return;

    loggerService.info(`[DirectoryManagerDatabaseService] Initializing at ${this.dbPath}`);

    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteInstance = new Database(this.dbPath);

      // Initialize schema natively
      this.sqliteInstance.exec(`
        CREATE TABLE IF NOT EXISTS directory_registry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          directory_name TEXT NOT NULL,
          current_version TEXT NOT NULL,
          record_count INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          active_database TEXT NOT NULL,
          last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS directory_update_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          directory_name TEXT NOT NULL,
          old_version TEXT,
          new_version TEXT NOT NULL,
          status TEXT NOT NULL,
          error_message TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS directory_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      this.dbInstance = drizzle(this.sqliteInstance) as unknown as VyoraDatabase;
      this.seedInitialMetadata();
      loggerService.info(`[DirectoryManagerDatabaseService] Initialization complete.`);
    } catch (error) {
      loggerService.error('[DirectoryManagerDatabaseService] Initialization failed:', error);
      throw error;
    }
  }

  private seedInitialMetadata(): void {
    if (!this.sqliteInstance) return;

    // Seed directories_v2.db as active if not set or if it's currently v1
    const activeSetting = this.sqliteInstance
      .prepare('SELECT value FROM directory_settings WHERE key = ?')
      .get('active_directory_database') as { value: string } | undefined;

    // Transition to highest available version
    const activeVal = activeSetting?.value;
    const v5Path = path.join(path.dirname(this.dbPath), 'directories_v5.db');
    const v4Path = path.join(path.dirname(this.dbPath), 'directories_v4.db');
    const v3Path = path.join(path.dirname(this.dbPath), 'directories_v3.db');
    const v2Path = path.join(path.dirname(this.dbPath), 'directories_v2.db');

    if (activeVal !== 'directories_v5.db' && fs.existsSync(v5Path)) {
      loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v5.db');
      if (activeVal) {
        this.sqliteInstance
          .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
          .run('last_known_good_database', activeVal);
      }
      this.sqliteInstance
        .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
        .run('active_directory_database', 'directories_v5.db');
    } else if (
      activeVal !== 'directories_v5.db' &&
      activeVal !== 'directories_v4.db' &&
      fs.existsSync(v4Path)
    ) {
      loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v4.db');
      if (activeVal) {
        this.sqliteInstance
          .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
          .run('last_known_good_database', activeVal);
      }
      this.sqliteInstance
        .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
        .run('active_directory_database', 'directories_v4.db');
    } else if (
      activeVal !== 'directories_v5.db' &&
      activeVal !== 'directories_v4.db' &&
      activeVal !== 'directories_v3.db' &&
      fs.existsSync(v3Path)
    ) {
      loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v3.db');
      if (activeVal) {
        this.sqliteInstance
          .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
          .run('last_known_good_database', activeVal);
      }
      this.sqliteInstance
        .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
        .run('active_directory_database', 'directories_v3.db');
    } else if (
      activeVal !== 'directories_v5.db' &&
      activeVal !== 'directories_v4.db' &&
      activeVal !== 'directories_v3.db' &&
      activeVal !== 'directories_v2.db' &&
      fs.existsSync(v2Path)
    ) {
      loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v2.db');
      if (activeVal) {
        this.sqliteInstance
          .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
          .run('last_known_good_database', activeVal);
      }
      this.sqliteInstance
        .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
        .run('active_directory_database', 'directories_v2.db');
    } else if (!activeSetting) {
      this.sqliteInstance
        .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
        .run('active_directory_database', 'directories_v1.db');
    }

    // Seed registry for pincode
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v2', record_count = 165627, checksum = 'chk_pincode_v2', active_database = 'directories_v2.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'pincode'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'pincode', 'v2', 165627, 'chk_pincode_v2', 'directories_v2.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'pincode')
    `,
      )
      .run();

    // Seed registry for country
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 250, checksum = 'chk_country_v1', active_database = 'directories_v2.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'country'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'country', 'v1', 250, 'chk_country_v1', 'directories_v2.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'country')
    `,
      )
      .run();

    // Seed registry for currency
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 154, checksum = 'chk_currency_v1', active_database = 'directories_v3.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'currency'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'currency', 'v1', 154, 'chk_currency_v1', 'directories_v3.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'currency')
    `,
      )
      .run();

    // Seed registry for state
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 36, checksum = 'chk_state_v1', active_database = 'directories_v3.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'state'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'state', 'v1', 36, 'chk_state_v1', 'directories_v3.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'state')
    `,
      )
      .run();

    // Seed registry for uqc
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 53, checksum = 'chk_uqc_v1', active_database = 'directories_v4.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'uqc'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'uqc', 'v1', 53, 'chk_uqc_v1', 'directories_v4.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'uqc')
    `,
      )
      .run();

    // Seed registry for hsn
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 21927, checksum = 'chk_hsn_v1', active_database = 'directories_v5.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'hsn'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'hsn', 'v1', 21927, 'chk_hsn_v1', 'directories_v5.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'hsn')
    `,
      )
      .run();

    // Seed registry for sac
    this.sqliteInstance
      .prepare(
        "UPDATE directory_registry SET current_version = 'v1', record_count = 681, checksum = 'chk_sac_v1', active_database = 'directories_v5.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'sac'",
      )
      .run();
    this.sqliteInstance
      .prepare(
        `
      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)
      SELECT 'sac', 'v1', 681, 'chk_sac_v1', 'directories_v5.db'
      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'sac')
    `,
      )
      .run();
  }

  public getDb(): VyoraDatabase {
    if (!this.dbInstance) {
      this.init();
    }
    return this.dbInstance!;
  }

  public close(): void {
    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.sqliteInstance = null;
      this.dbInstance = null;
    }
  }

  public async getActiveDirectoryDatabase(): Promise<string | null> {
    const db = this.getDb();
    const setting = await db
      .select()
      .from(directorySettings)
      .where(eq(directorySettings.key, 'active_directory_database'))
      .get();
    return setting?.value || null;
  }

  public async setActiveDirectoryDatabase(fileName: string): Promise<void> {
    const db = this.getDb();
    await db
      .insert(directorySettings)
      .values({ key: 'active_directory_database', value: fileName })
      .onConflictDoUpdate({ target: directorySettings.key, set: { value: fileName } });
  }

  public async getLastKnownGoodDatabase(): Promise<string | null> {
    const db = this.getDb();
    const setting = await db
      .select()
      .from(directorySettings)
      .where(eq(directorySettings.key, 'last_known_good_database'))
      .get();
    return setting?.value || null;
  }

  public async setLastKnownGoodDatabase(fileName: string): Promise<void> {
    const db = this.getDb();
    await db
      .insert(directorySettings)
      .values({ key: 'last_known_good_database', value: fileName })
      .onConflictDoUpdate({ target: directorySettings.key, set: { value: fileName } });
  }
}

export const directoryManagerDatabaseService = new DirectoryManagerDatabaseService();
