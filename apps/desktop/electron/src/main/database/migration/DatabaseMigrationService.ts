import * as fs from 'fs';

import { loggerService } from '../../../services/logger/LoggerService';
import { DatabaseEngine, DEFAULT_DATABASE_ENGINE } from '../DatabaseEngine';

class DatabaseMigrationService {
  public databaseExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  public isPlaintextDatabase(filePath: string): boolean {
    if (!this.databaseExists(filePath)) return false;
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      return buffer.toString('utf8').startsWith('SQLite format 3');
    } catch (error) {
      loggerService.error('[DatabaseMigrationService] Failed to read database header:', error);
      return false;
    }
  }

  public isEncryptedDatabase(filePath: string): boolean {
    if (!this.databaseExists(filePath)) return false;
    // If it exists and is NOT plaintext, we assume it is encrypted.
    return !this.isPlaintextDatabase(filePath);
  }

  public requiresMigration(filePath: string): boolean {
    // True if it exists and is unencrypted.
    return this.isPlaintextDatabase(filePath);
  }

  public getRecommendedEngine(filePath: string): DatabaseEngine {
    if (this.requiresMigration(filePath)) {
      loggerService.info(
        '[DatabaseMigrationService] Database requires migration (plaintext detected). Booting with SQLiteAdapter temporarily.',
      );
      return DatabaseEngine.SQLITE;
    }

    return DEFAULT_DATABASE_ENGINE;
  }
}

export const databaseMigrationService = new DatabaseMigrationService();
