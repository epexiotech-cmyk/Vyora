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
}

export const fileSystemService = new FileSystemService();
