import { ipcMain } from 'electron';

import { DeveloperFeatures } from '../../main/DeveloperFeatures';

export function registerDeveloperFeaturesHandlers() {
  ipcMain.handle('developer:isEnabled', () => {
    return DeveloperFeatures.isEnabled();
  });
}
