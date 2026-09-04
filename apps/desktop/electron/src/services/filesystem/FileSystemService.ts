import * as fs from 'fs';
import * as path from 'path';

import { app } from 'electron';

import { loggerService } from '../logger/LoggerService';

export class FileSystemService {
  private baseDir: string;

  public dirs = {
    backups: '',
    exports: '',
    attachments: '',
    templates: '',
  };

  constructor() {
    this.baseDir = app.getPath('userData');

    this.dirs = {
      backups: path.join(this.baseDir, 'backups'),
      exports: path.join(this.baseDir, 'exports'),
      attachments: path.join(this.baseDir, 'attachments'),
      templates: path.join(this.baseDir, 'templates'),
    };
  }

  public init() {
    loggerService.info('[FileSystem] Initializing directories...');

    for (const dirPath of Object.values(this.dirs)) {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        loggerService.debug(`[FileSystem] Created directory: ${dirPath}`);
      }
    }

    loggerService.info('[FileSystem] Initialization complete.');
  }

  public getPath(type: keyof typeof this.dirs): string {
    return this.dirs[type];
  }

  public resolveAttachmentPath(relativePath: string): string | null {
    // Prevent obvious path traversal in the input
    if (relativePath.includes('..')) {
      return null;
    }

    // Normalize path to OS specific separators
    const normalizedPath = path.normalize(relativePath);
    const absolutePath = path.join(this.dirs.attachments, normalizedPath);

    // Ensure the resolved path strictly resides within the attachments folder
    if (!absolutePath.startsWith(this.dirs.attachments)) {
      return null;
    }

    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    return null;
  }

  public getCompanyLogoDirectory(companyId: string): string {
    const dir = path.join(this.dirs.attachments, 'companies', companyId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public getCompanyLogoPath(companyId: string, filename: string): string {
    const dir = this.getCompanyLogoDirectory(companyId);
    const safeFilename = path.basename(filename);
    return path.join(dir, safeFilename);
  }

  public saveCompanyLogo(companyId: string, filename: string, buffer: Buffer): string {
    const destPath = this.getCompanyLogoPath(companyId, filename);
    fs.writeFileSync(destPath, buffer);
    return destPath;
  }

  public deleteCompanyLogo(companyId: string, filename: string): void {
    const targetPath = this.getCompanyLogoPath(companyId, filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }

  public getCompanySignaturePath(companyId: string, filename: string): string {
    const dir = this.getCompanyLogoDirectory(companyId);
    const safeFilename = path.basename(filename);
    return path.join(dir, safeFilename);
  }

  public saveCompanySignature(companyId: string, filename: string, buffer: Buffer): string {
    const destPath = this.getCompanySignaturePath(companyId, filename);
    fs.writeFileSync(destPath, buffer);
    return destPath;
  }

  public deleteCompanySignature(companyId: string, filename: string): void {
    const targetPath = this.getCompanySignaturePath(companyId, filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }

  public getEmployeeDocumentDirectory(companyId: string, employeeId: string): string {
    const dir = path.join(this.dirs.attachments, 'companies', companyId, 'employees', employeeId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public getEmployeeDocumentPath(companyId: string, employeeId: string, filename: string): string {
    const dir = this.getEmployeeDocumentDirectory(companyId, employeeId);
    const safeFilename = path.basename(filename);
    return path.join(dir, safeFilename);
  }

  public saveEmployeeDocument(
    companyId: string,
    employeeId: string,
    filename: string,
    buffer: Buffer,
  ): string {
    const destPath = this.getEmployeeDocumentPath(companyId, employeeId, filename);
    fs.writeFileSync(destPath, buffer);
    return destPath;
  }

  public deleteEmployeeDocument(companyId: string, employeeId: string, filename: string): void {
    const targetPath = this.getEmployeeDocumentPath(companyId, employeeId, filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

export const fileSystemService = new FileSystemService();
