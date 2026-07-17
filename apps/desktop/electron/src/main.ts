import * as path from 'path';
import { pathToFileURL } from 'url';

import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

import { registerAllHandlers } from './ipc/handlers';
import { databaseIntegrityService } from './main/security/DatabaseIntegrityService';
import { encryptionService } from './main/security/EncryptionService';
import { keyManagementService } from './main/security/KeyManagementService';
import { runTest } from './run-sales-test';
import { companyContextService } from './services/CompanyContextService';
import { dbService } from './services/database/DatabaseService';
import { directoryManagerDatabaseService } from './services/database/DirectoryManagerDatabaseService';
import { fileSystemService } from './services/filesystem/FileSystemService';
import { financialYearContextService } from './services/FinancialYearContextService';
import { loggerService } from './services/logger/LoggerService';
import { MainWindow } from './windows/MainWindow';
import { SplashWindow } from './windows/SplashWindow';

let mainWindow: MainWindow | null = null;
let splashWindow: SplashWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  await app.whenReady();

  protocol.handle('app', (request) => {
    let urlPath = decodeURIComponent(request.url.slice('app://-'.length));
    urlPath = urlPath.split('?')[0].split('#')[0];
    if (urlPath === '' || urlPath === '/' || urlPath.endsWith('/')) {
      urlPath = '/index.html';
    } else if (!urlPath.includes('.') && !urlPath.startsWith('/_next')) {
      urlPath += '.html';
    }
    const absolutePath = path.join(__dirname, '../renderer/out', urlPath);
    return net.fetch(pathToFileURL(absolutePath).toString());
  });

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
    await directoryManagerDatabaseService.bootDirectoryDatabase();
    registerAllHandlers();

    try {
      await companyContextService.loadActiveCompany();
      const activeCompanyId = companyContextService.getActiveCompany();
      if (activeCompanyId) {
        await financialYearContextService.loadActiveFinancialYear(activeCompanyId);
      }
      loggerService.info('Active company context loaded');
    } catch (e) {
      loggerService.warn('Failed to load active company context: ' + e);
    }

    if (process.env.RUN_SALES_TEST === 'true') {
      try {
        loggerService.info('STARTING SALES RUNTIME TEST');
        await runTest();
        loggerService.info('SALES RUNTIME TEST FINISHED');
      } catch (e) {
        loggerService.error('RUNTEST FAILED', e);
      }
    }
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
