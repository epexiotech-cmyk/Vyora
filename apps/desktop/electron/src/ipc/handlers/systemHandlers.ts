import { ipcMain, app, shell } from 'electron';

export function registerSystemHandlers() {
  ipcMain.handle('system:show-about', async () => {
    try {
      app.showAboutPanel();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('system:openPath', async (_, path: string) => {
    const errorMessage = await shell.openPath(path);
    if (errorMessage) {
      return { success: false, error: errorMessage };
    }
    return { success: true };
  });

  ipcMain.handle('system:showItemInFolder', async (_, path: string) => {
    shell.showItemInFolder(path);
    return { success: true };
  });
}
