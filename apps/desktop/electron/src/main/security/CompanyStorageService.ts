import * as fs from 'fs';
import * as path from 'path';

import { app } from 'electron';

export const LEGACY_DATABASE_EXTENSION = '.db';
export const ACTIVE_DATABASE_EXTENSION = '.vyr';

class CompanyStorageService {
  private static instance: CompanyStorageService;

  private constructor() {}

  public static getInstance(): CompanyStorageService {
    if (!CompanyStorageService.instance) {
      CompanyStorageService.instance = new CompanyStorageService();
    }
    return CompanyStorageService.instance;
  }

  public getLegacyDatabasePath(companyId: string): string {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');
    return path.join(dbDir, `${companyId}${LEGACY_DATABASE_EXTENSION}`);
  }

  public getEncryptedDatabasePath(companyId: string): string {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');
    return path.join(dbDir, `${companyId}${ACTIVE_DATABASE_EXTENSION}`);
  }

  public getCompanyDatabasePath(companyId: string): string {
    const activePath = this.getEncryptedDatabasePath(companyId);
    const legacyPath = this.getLegacyDatabasePath(companyId);

    if (fs.existsSync(activePath)) return activePath;
    if (fs.existsSync(legacyPath)) return legacyPath;

    return activePath;
  }

  public databaseExists(companyId: string): boolean {
    const activePath = this.getEncryptedDatabasePath(companyId);
    const legacyPath = this.getLegacyDatabasePath(companyId);
    return fs.existsSync(activePath) || fs.existsSync(legacyPath);
  }
}

export const companyStorageService = CompanyStorageService.getInstance();
