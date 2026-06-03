import { app, BrowserWindow, ipcMain } from 'electron';

import { registerCustomerHandlers, registerProductHandlers } from './ipc/handlers/dbHandlers';
import { databaseIntegrityService } from './main/security/DatabaseIntegrityService';
import { encryptionService } from './main/security/EncryptionService';
import { keyManagementService } from './main/security/KeyManagementService';
import { dbService } from './services/database/DatabaseService';
import { fileSystemService } from './services/filesystem/FileSystemService';
import { loggerService } from './services/logger/LoggerService';
import { MainWindow } from './windows/MainWindow';
import { SplashWindow } from './windows/SplashWindow';

let mainWindow: MainWindow | null = null;
let splashWindow: SplashWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  await app.whenReady();

  // Show Splash Screen immediately
  splashWindow = new SplashWindow();
  await splashWindow.create();

  // Initialize Core Infrastructure
  loggerService.init();
  fileSystemService.init();

  // Initialize Security Services
  const keyExists = (await keyManagementService.getKeyInfo()).exists;
  await keyManagementService.ensureMasterKey();
  if (keyExists) {
    loggerService.info('Master encryption key loaded');
  } else {
    loggerService.info('Master encryption key generated');
  }

  await encryptionService.init();
  await databaseIntegrityService.init();

  // IPC Handlers
  ipcMain.handle('system:ping', () => {
    return 'Electron Connected';
  });

  try {
    await dbService.init();
    registerCustomerHandlers();
    registerProductHandlers();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  let splashFinished = false;

  const finishSplash = async () => {
    if (splashFinished) return;
    splashFinished = true;

    mainWindow = new MainWindow(isDev);
    await mainWindow.create(() => {
      splashWindow?.fadeOutAndClose();
      splashWindow = null;
      mainWindow?.window?.show();
    });
  };

  // Wait for splash animation IPC event or timeout
  ipcMain.once('splash-finished', finishSplash);
  setTimeout(finishSplash, 5000);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new MainWindow(isDev);
      await mainWindow.create(() => {
        mainWindow?.window?.show();
      });
    }
  });
}

bootstrap();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
