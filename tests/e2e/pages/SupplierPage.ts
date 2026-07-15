import { Page, expect } from '@playwright/test';

export class SupplierPage {
  constructor(private readonly page: Page) {}

  async createSupplier(name: string, email: string, phone: string) {
    await this.page.getByTestId('create-supplier-btn').click();
    await this.page.getByTestId('supplier-name-input').fill(name);
    await this.page.getByTestId('supplier-email-input').fill(email);
    await this.page.getByTestId('supplier-phone-input').fill(phone);
    await this.page.getByTestId('save-supplier-btn').click();

    // Wait for drawer to close and item to appear in the list
    await expect(this.page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
    await this.verifySupplierExists(name);
  }

  async verifySupplierExists(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });
  }
}
