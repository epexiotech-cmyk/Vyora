import { app } from 'electron';

export class DeveloperFeatures {
  public static isEnabled(): boolean {
    return !app.isPackaged || process.env.VYORA_DEVTOOLS === 'true';
  }
}
