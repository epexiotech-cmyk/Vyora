import { Page, expect } from '@playwright/test';

export class ItemPage {
  constructor(private readonly page: Page) {}

  async createItem(name: string, price: number) {
    // this.page.on('console', msg => console.log(msg.text()));
    await this.page.getByTestId('create-item-btn').click();
    await this.page.getByTestId('item-name-input').fill(name);
    await this.page.getByTestId('item-price-input').fill(price.toString());

    // Select unit and tax as they are required by the form!
    // Since we don't have deterministic IDs for unit/tax, we'll just pick the second option.
    const unitSelect = this.page.locator('select[name="unitId"]');
    const taxSelect = this.page.locator('select[name="taxId"]');

    // Wait for the selects to have options populated
    await expect(unitSelect.locator('option').nth(1)).toBeAttached({ timeout: 5000 });
    await expect(taxSelect.locator('option').nth(1)).toBeAttached({ timeout: 5000 });

    const unitOptions = await unitSelect.locator('option').allTextContents();
    const targetUnit = unitOptions.find((opt) => opt.includes('NOS') || opt.includes('Numbers'));
    if (!targetUnit)
      throw new Error(`Required Unit master data missing. Found: ${unitOptions.join(', ')}`);
    await unitSelect.selectOption({ label: targetUnit });

    const taxOptions = await taxSelect.locator('option').allTextContents();
    const targetTax = taxOptions.find((opt) => opt.includes('GST 18%'));
    if (!targetTax)
      throw new Error(`Required Tax master data missing. Found: ${taxOptions.join(', ')}`);
    await taxSelect.selectOption({ label: targetTax });

    await this.page.getByTestId('save-item-btn').click();
    await this.page.waitForURL('**/dashboard/items');
  }

  async verifyItemExists(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });
  }
}
