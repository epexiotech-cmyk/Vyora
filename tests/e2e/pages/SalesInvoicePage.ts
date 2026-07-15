import { Page, expect } from '@playwright/test';

export class SalesInvoicePage {
  constructor(private readonly page: Page) {}

  async createDraftSales(customerName: string, itemName: string, qty: number, rate: number) {
    await this.page.getByTestId('create-sales-btn').click();

    // Select customer
    await this.page.getByTestId('sales-customer-select').click();
    await this.page.getByTestId(`customer-option-${customerName}`).click();

    // Add item line
    await this.page.getByTestId('add-sales-line-btn').click();
    await this.page.getByTestId('line-item-select-0').click();
    await this.page.getByTestId(`item-option-${itemName}`).click();

    await this.page.getByTestId('line-qty-input-0').fill(qty.toString());
    await this.page.getByTestId('line-rate-input-0').fill(rate.toString());

    // Save Draft
    await this.page.getByTestId('save-draft-sales-btn').click();

    // Wait for the navigation to the edit page and the submit button to be visible
    await expect(this.page.getByTestId('submit-sales-btn')).toBeVisible({ timeout: 10000 });
  }

  async submitSales() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByTestId('submit-sales-btn').click();
  }

  async rapidDoubleSubmitSales() {
    // Tests race condition protections by clicking twice very quickly without waiting
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByTestId('submit-sales-btn').dblclick();
  }

  async cancelSales() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByTestId('cancel-sales-btn').click();
  }

  async verifyStatus(status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED') {
    await expect(this.page.getByTestId('sales-status-badge')).toHaveText(status);
  }
}
