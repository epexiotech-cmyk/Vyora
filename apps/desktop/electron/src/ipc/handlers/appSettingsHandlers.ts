import { ipcMain, nativeTheme } from 'electron';

import { loggerService } from '../../services/logger/LoggerService';
import { settingsService } from '../../services/settings/SettingsService';

export function registerAppSettingsHandlers() {
  ipcMain.handle('settings:app:getAppearance', async () => {
    try {
      const appearance = settingsService.get('appearance');
      return { success: true, data: appearance };
    } catch (error) {
      loggerService.error('Error in settings:app:getAppearance:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'settings:app:setAppearance',
    async (_, appearance: { theme: 'light' | 'dark' | 'system' }) => {
      try {
        settingsService.set('appearance', appearance);
        nativeTheme.themeSource = appearance.theme;
        return { success: true, data: undefined };
      } catch (error) {
        loggerService.error('Error in settings:app:setAppearance:', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
