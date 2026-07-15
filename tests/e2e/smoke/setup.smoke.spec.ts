import { test } from '../fixtures/electron.fixture';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Smoke: Setup and Dashboard', () => {
  test('Application launches and completes company setup', async ({ mainWindow }) => {
    // 1. App Launch happens automatically in the fixture

    // 2. Complete Company Setup via Setup Wizard
    await mainWindow.getByPlaceholder('Enter business name').fill('Global Corp');
    await mainWindow.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Configure Details (The wizard in fixture just clicks Create Company directly)
    await mainWindow.getByRole('button', { name: 'Create Company' }).click();

    // Step 3: Success Screen
    await mainWindow.getByRole('button', { name: 'Go To Dashboard' }).click();

    // 3. Verify Dashboard loads after setup
    const dashboardPage = new DashboardPage(mainWindow);
    await dashboardPage.verifyDashboardLoaded();
  });
});
