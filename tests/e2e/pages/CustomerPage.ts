import { Page, expect } from '@playwright/test';

export class CustomerPage {
  constructor(private readonly page: Page) {}

  async createCustomer(name: string, email: string, phone: string) {
    await this.page.getByTestId('create-customer-btn').click();
    await this.page.getByTestId('customer-name-input').fill(name);
    await this.page.getByTestId('customer-email-input').fill(email);
    await this.page.getByTestId('customer-phone-input').fill(phone);
    await this.page.getByTestId('save-customer-btn').click();
  }

  async verifyCustomerExists(name: string) {
    await expect(this.page.getByTestId(`customer-row-${name}`)).toBeVisible();
  }
}
