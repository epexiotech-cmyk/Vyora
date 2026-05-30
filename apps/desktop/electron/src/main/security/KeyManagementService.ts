import * as crypto from 'crypto';

import * as keytar from 'keytar';

const SERVICE_NAME = 'Vyora';
const ACCOUNT_NAME = 'master-encryption-key';

class KeyManagementService {
  private static instance: KeyManagementService;

  private constructor() {}

  public static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  public async init(): Promise<void> {
    // Key management is initialized via ensureMasterKey
  }

  public async ensureMasterKey(): Promise<string> {
    let key = await this.loadKey();
    if (key) {
      return key;
    }

    key = this.generateKey();
    await this.saveKey(key);
    return key;
  }

  public generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public async saveKey(key: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key);
  }

  public async loadKey(): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  public async deleteKey(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  public async getKeyInfo(): Promise<{ exists: boolean; length: number }> {
    const key = await this.loadKey();
    return {
      exists: !!key,
      length: key ? key.length : 0,
    };
  }
}

export const keyManagementService = KeyManagementService.getInstance();
