import * as path from 'path';
import { pathToFileURL } from 'url';

import { app, BrowserWindow, ipcMain, protocol, net, nativeTheme } from 'electron';

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
  {
    scheme: 'vyora-asset',
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
import { companyContextService } from './services/CompanyContextService';
import { dbService } from './services/database/DatabaseService';
import { directoryManagerDatabaseService } from './services/database/DirectoryManagerDatabaseService';
import { fileSystemService } from './services/filesystem/FileSystemService';
import { financialYearContextService } from './services/FinancialYearContextService';
import { loggerService } from './services/logger/LoggerService';
import { settingsService } from './services/settings/SettingsService';
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

  protocol.handle('vyora-asset', async (request) => {
    try {
      const urlPath = decodeURIComponent(request.url.slice('vyora-asset://'.length));
      const cleanPath = urlPath.split('?')[0].split('#')[0];

      const { fileSystemService } = await import('./services/filesystem/FileSystemService');
      const resolvedPath = fileSystemService.resolveAttachmentPath(cleanPath);

      if (!resolvedPath) {
        return new Response('Not Found', { status: 404 });
      }

      return net.fetch(pathToFileURL(resolvedPath).toString());
    } catch (err) {
      console.error('Vyora Asset Protocol Error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  // Show Splash Screen immediately
  splashWindow = new SplashWindow();
  await splashWindow.create();

  // Initialize Core Infrastructure
  loggerService.init();
  fileSystemService.init();

  // Apply Theme
  const appearance = settingsService.get('appearance');
  if (appearance?.theme) {
    nativeTheme.themeSource = appearance.theme;
  }

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
    try {
      await dbService.init();
    } catch (err) {
      console.error('[BOOT ERROR] DatabaseService failed', err);
      throw err;
    }

    try {
      await directoryManagerDatabaseService.bootDirectoryDatabase();
    } catch (err) {
      console.error('[BOOT ERROR] Directory databases failed', err);
      throw err;
    }

    try {
      registerAllHandlers();
      ipcMain.handle('system:test', () => {
        return 'OK';
      });
    } catch (err) {
      console.error('[BOOT ERROR] registerAllHandlers failed', err);
      throw err;
    }

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

        loggerService.info('SALES RUNTIME TEST FINISHED');
      } catch (e) {
        loggerService.error('RUNTEST FAILED', e);
      }
    }

    if (process.env.DEV_UTILITY) {
      try {
        const utilName = process.env.DEV_UTILITY;
        loggerService.info(`STARTING DEV UTILITY: ${utilName}`);

        /* eslint-disable no-console */
        if (utilName === 'check-inventory') {
          const { inventoryAdminService } = await import('./services/admin/InventoryAdminService');
          const mismatches = await inventoryAdminService.checkInventoryIntegritySync();
          if (mismatches.length === 0) {
            console.log('✅ Inventory is fully synchronized. No integrity issues found.');
          } else {
            console.log(
              `❌ Found ${mismatches.length} mismatches between stock_movements and inventory_balances!`,
            );
            console.table(mismatches);
          }
        } else if (utilName === 'rebuild-inventory') {
          const { inventoryAdminService } = await import('./services/admin/InventoryAdminService');
          await inventoryAdminService.rebuildInventorySync();
          console.log('Successfully rebuilt inventory balances!');
        } else if (utilName === 'reset-transactions') {
          const { transactionResetService } =
            await import('./services/admin/TransactionResetService');
          await transactionResetService.hardResetAllSync();
          console.log('Successfully cleared all transactional data!');
        } else if (utilName === 'query-new-product') {
          const { dbService } = await import('./services/database/DatabaseService');
          const { products, inventory_balances, stock_movements } = await import('@vyora/database');
          const { desc, eq } = await import('drizzle-orm');

          const db = dbService.getDb();
          const product = await db
            .select()
            .from(products)
            .orderBy(desc(products.createdAt))
            .limit(1)
            .then((res) => res[0]);

          console.log('PRODUCT:', product);

          if (product) {
            const balances = await db
              .select()
              .from(inventory_balances)
              .where(eq(inventory_balances.productId, product.id));
            console.log('BALANCES:', balances);

            const movements = await db
              .select()
              .from(stock_movements)
              .where(eq(stock_movements.productId, product.id));
            console.log('MOVEMENTS:', movements);
          }
        }
        /* eslint-enable no-console */

        app.exit(0);
        return;
      } catch (err) {
        loggerService.error('DEV UTILITY FAILED', err);
        app.exit(1);
        return;
      }
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  let splashFinished = false;

  const finishSplash = async () => {
    if (splashFinished) return;
    splashFinished = true;

    try {
      mainWindow = new MainWindow(isDev);
      await mainWindow.create(() => {
        splashWindow?.fadeOutAndClose();
        splashWindow = null;
        mainWindow?.window?.show();
      });
    } catch (err) {
      console.error('[BOOT ERROR] BrowserWindow creation failed', err);
    }
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
