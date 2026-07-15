import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false, // Electron tests often share DB/resources, so serial is safer initially
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: 'tests/e2e/reports/html-report' }], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  webServer: {
    command: 'pnpm --filter @vyora/desktop dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'smoke',
      testDir: './tests/e2e',
      testMatch: /.*smoke.spec.ts/,
    },
    {
      name: 'regression',
      testDir: './tests/e2e',
      testMatch: /.*regression.spec.ts/,
    },
    {
      name: 'stress',
      testDir: './tests/e2e',
      testMatch: /.*stress.spec.ts/,
    },
    {
      name: 'release',
      testDir: './tests/e2e',
      testMatch: /.*release.spec.ts/,
    },
  ],
});
