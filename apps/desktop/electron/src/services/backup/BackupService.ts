import * as fs from 'fs';
import * as path from 'path';

import { companyStorageService } from '../../main/security/CompanyStorageService';
import { fileSystemService } from '../filesystem/FileSystemService';
import { loggerService } from '../logger/LoggerService';

export class BackupService {
  constructor() {}

  public async createManualBackup(): Promise<{ success: boolean; error?: string; path?: string }> {
    try {
      loggerService.info('[Backup] Starting manual backup...');

      const dbPath = companyStorageService.getCompanyDatabasePath('vyora');
      if (!fs.existsSync(dbPath)) {
        throw new Error('Database file not found for backup.');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `vyora_backup_${timestamp}.db`;
      const backupsDir = fileSystemService.getPath('backups');
      const destPath = path.join(backupsDir, backupFilename);

      // In a real app we would copy and compress (e.g. zip). For now, direct copy.
      fs.copyFileSync(dbPath, destPath);

      loggerService.info(`[Backup] Manual backup completed: ${destPath}`);

      return { success: true, path: destPath };
    } catch (err: unknown) {
      loggerService.error('[Backup] Manual backup failed:', err);
      return { success: false, error: (err as Error).message };
    }
  }
}

export const backupService = new BackupService();
