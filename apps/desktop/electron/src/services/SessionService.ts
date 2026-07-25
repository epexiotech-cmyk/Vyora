import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { app } from 'electron';

import { encryptionService } from '../main/security/EncryptionService';

import { loggerService } from './logger/LoggerService';

export class SessionService {
  private getSessionFilePath(): string {
    return path.join(app.getPath('userData'), 'session.enc');
  }

  public generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async saveSessionToken(token: string): Promise<void> {
    try {
      const encrypted = encryptionService.encrypt(token);
      fs.writeFileSync(this.getSessionFilePath(), encrypted);
    } catch (error) {
      loggerService.error('Failed to save session token', error);
      throw error;
    }
  }

  public async loadSessionToken(): Promise<string | null> {
    try {
      const filePath = this.getSessionFilePath();
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const encryptedData = fs.readFileSync(filePath, 'utf8');
      const decrypted = encryptionService.decrypt(encryptedData);
      return decrypted;
    } catch (error) {
      loggerService.error('Failed to load session token', error);
      return null;
    }
  }

  public clearSessionToken(): void {
    try {
      const filePath = this.getSessionFilePath();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      loggerService.error('Failed to clear session token', error);
    }
  }
}

export const sessionService = new SessionService();
