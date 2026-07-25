import { safeStorage } from 'electron';

class EncryptionService {
  private static instance: EncryptionService;

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  public async init(): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }
  }

  public encrypt(data: string | Buffer): string {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    return safeStorage.encryptString(buffer.toString('utf-8')).toString('base64');
  }

  public decrypt(data: string): string {
    const buffer = Buffer.from(data, 'base64');
    return safeStorage.decryptString(buffer);
  }
}

export const encryptionService = EncryptionService.getInstance();
