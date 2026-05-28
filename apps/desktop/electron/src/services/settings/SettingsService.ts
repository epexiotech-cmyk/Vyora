import Store from 'electron-store';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  backupPath?: string;
  autoBackup: boolean;
}

const defaults: AppSettings = {
  theme: 'system',
  sidebarCollapsed: false,
  autoBackup: false,
};

export class SettingsService {
  private store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'vyora-settings',
      defaults,
    });
  }

  public get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  public set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
  }

  public getAll(): AppSettings {
    return this.store.store;
  }
}

export const settingsService = new SettingsService();
