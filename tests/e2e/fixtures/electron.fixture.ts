/* eslint-disable no-console */
import { test as base, _electron, ElectronApplication, Page } from '@playwright/test';

import { setupTestDatabase, cleanupTestDatabase, DBClient } from '../utils/database.utils';

type TestFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
  database: DBClient;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  database: async ({}, use) => {
    // Setup a fresh test database for this test run
    const client = await setupTestDatabase();
    await use(client);
    // Cleanup after test
    await cleanupTestDatabase(client);
  },

  electronApp: async ({ database }, use) => {
    // Launch electron app using the root directory (where main process is built)
    // We pass the test DB path via environment variable or args
    const electronApp = await _electron.launch({
      args: ['apps/desktop/dist-electron/main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VYORA_DB_PATH: database.dbPath,
      },
    });

    electronApp.process().stdout?.on('data', (data) => console.log(`[Electron]: ${data}`));
    electronApp.process().stderr?.on('data', (data) => console.error(`[Electron Error]: ${data}`));

    // Wait for the app to be ready
    await electronApp.waitForEvent('window');

    await use(electronApp);

    // Clean shutdown
    await electronApp.close();
  },

  mainWindow: async ({ electronApp }, use, testInfo) => {
    let window;

    // Wait for a window that is NOT the splash screen
    for (let i = 0; i < 50; i++) {
      const windows = electronApp.windows();
      window = windows.find((w) => !w.url().includes('splash.html') && w.url() !== 'about:blank');
      if (window) {
        break;
      }

      // Wait for a new window event if we haven't found it yet
      const newWindow = await electronApp.waitForEvent('window');
      // Briefly wait for URL to populate
      await newWindow.waitForLoadState('domcontentloaded').catch(() => {});
    }

    if (!window) {
      throw new Error('Main window not found');
    }

    // Wait for the renderer to load either the Setup Wizard or the Dashboard
    try {
      const setupOrDashboard = await Promise.race([
        window
          .waitForSelector('text="Create Your Business"', { timeout: 15000 })
          .then(() => 'setup'),
        window.waitForSelector('text="Dashboard"', { timeout: 15000 }).then(() => 'dashboard'),
      ]);

      if (setupOrDashboard === 'setup') {
        const isSetupTest = testInfo.file.includes('setup.smoke.spec.ts');
        if (isSetupTest) {
          console.log('Setup test detected. Skipping automatic setup wizard completion.');
        } else {
          // Automatically complete the Setup Wizard
          console.log('Completing Setup Wizard...');
          await window.getByPlaceholder('Enter business name').fill('Test Company');
          await window.getByRole('button', { name: 'Continue' }).click();

          // Step 2
          await window.getByRole('button', { name: 'Create Company' }).click();

          // Step 3
          await window.getByRole('button', { name: 'Go To Dashboard' }).click();

          // Wait for dashboard to load
          await window.waitForSelector('text="Dashboard"');
          console.log('Setup Wizard completed.');
        }
      }
    } catch (e) {
      console.log('Failed to detect initial app state', e);
    }

    await use(window);
  },
});

export { expect } from '@playwright/test';
