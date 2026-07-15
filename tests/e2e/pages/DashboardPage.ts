import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async navigateTo(
    moduleName: 'Customers' | 'Suppliers' | 'Items' | 'Purchases' | 'Sales' | 'Accounting',
  ) {
    await this.page.getByTestId(`nav-module-${moduleName.toLowerCase()}`).click();
  }

  async verifyDashboardLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 15000,
    });
    await expect(this.page.getByText('Database Status')).toBeVisible();
  }
}
