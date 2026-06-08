import path from 'path';

import { test as base, expect, ElectronApplication, Page, _electron } from '@playwright/test';

export const test = base.extend<{
  electronApp: ElectronApplication;
  page: Page;
}>({
  // eslint-disable-next-line no-empty-pattern
  electronApp: async ({}, use) => {
    const mainPath = path.resolve(__dirname, '../dist-electron/main.js');
    const electronApp = await _electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for the app to be ready
    await electronApp.waitForEvent('window');

    await use(electronApp);

    await electronApp.close();
  },
  page: async ({ electronApp }, use) => {
    // Get the first window that the app opens
    const window = await electronApp.firstWindow();
    await use(window);
  },
});

export { expect };
