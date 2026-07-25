import { ipcMain, app } from 'electron';

export function registerSystemHandlers() {
  ipcMain.handle('system:show-about', async () => {
    try {
      app.showAboutPanel();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
