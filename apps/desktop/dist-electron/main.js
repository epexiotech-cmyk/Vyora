'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const electron_1 = require('electron');
const MainWindow_1 = require('./windows/MainWindow');
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
async function bootstrap() {
  await electron_1.app.whenReady();
  // IPC Handlers
  electron_1.ipcMain.handle('system:ping', () => {
    return 'Electron Connected';
  });
  mainWindow = new MainWindow_1.MainWindow(isDev);
  await mainWindow.create();
  electron_1.app.on('activate', async () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new MainWindow_1.MainWindow(isDev);
      await mainWindow.create();
    }
  });
}
bootstrap();
electron_1.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron_1.app.quit();
  }
});
