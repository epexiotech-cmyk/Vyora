import { Page, expect } from '@playwright/test';

export class PurchaseInvoicePage {
  constructor(private readonly page: Page) {}

  async createDraftPurchase(supplierName: string, itemName: string, qty: number, rate: number) {
    await this.page.getByTestId('create-purchase-btn').click();

    // Select supplier
    await this.page.getByTestId('purchase-supplier-select').click();
    await this.page.getByTestId(`supplier-option-${supplierName}`).click();

    // Add item line
    await this.page.getByTestId('add-purchase-line-btn').click();
    await this.page.getByTestId('line-item-select-0').click();
    await this.page.getByTestId(`item-option-${itemName}`).click();

    await this.page.getByTestId('line-qty-input-0').fill(qty.toString());
    await this.page.getByTestId('line-rate-input-0').fill(rate.toString());

    // Save Draft
    await this.page.getByTestId('save-draft-purchase-btn').click();

    // Wait for the navigation to the edit page and the submit button to be visible
    await expect(this.page.getByTestId('submit-purchase-btn')).toBeVisible({ timeout: 10000 });
  }

  async submitPurchase() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByTestId('submit-purchase-btn').click();
  }

  async cancelPurchase() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByTestId('cancel-purchase-btn').click();
  }

  async verifyStatus(status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED') {
    await expect(this.page.getByTestId('purchase-status-badge')).toHaveText(status);
  }
}
