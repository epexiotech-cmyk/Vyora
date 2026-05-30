import { app, BrowserWindow, ipcMain } from 'electron';

import { registerCustomerHandlers, registerProductHandlers } from './ipc/handlers/dbHandlers';
import { databaseIntegrityService } from './main/security/DatabaseIntegrityService';
import { encryptionService } from './main/security/EncryptionService';
import { keyManagementService } from './main/security/KeyManagementService';
import { dbService } from './services/database/DatabaseService';
import { fileSystemService } from './services/filesystem/FileSystemService';
import { loggerService } from './services/logger/LoggerService';
import { MainWindow } from './windows/MainWindow';

let mainWindow: MainWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  await app.whenReady();

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

  // Database
  try {
    await dbService.init();
    registerCustomerHandlers();
    registerProductHandlers();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  mainWindow = new MainWindow(isDev);
  await mainWindow.create();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new MainWindow(isDev);
      await mainWindow.create();
    }
  });
}

bootstrap();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
