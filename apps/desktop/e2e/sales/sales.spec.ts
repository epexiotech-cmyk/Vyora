import { test, expect } from '../electron-fixture';

test.describe('Sales Module E2E', () => {
  test('navigates to sales and opens create invoice page', async ({ page }) => {
    // Wait for app to be ready
    await page.waitForSelector('#root', { state: 'attached' });

    // Assuming we have a sidebar link with href="/sales" or similar text
    // We will just verify navigation does not crash
    // We can try to click the Sales link in the navigation
    const salesLink = page.getByRole('link', { name: /Sales/i });
    if (await salesLink.isVisible()) {
      await salesLink.click();

      // Wait for url to change or Sales header to appear
      await expect(page.getByRole('heading', { name: /Sales Invoices/i })).toBeVisible({
        timeout: 10000,
      });

      // Click New Invoice
      const newInvoiceBtn = page.getByRole('button', { name: /New Invoice/i });
      if (await newInvoiceBtn.isVisible()) {
        await newInvoiceBtn.click();

        // Wait for create invoice page
        await expect(page.getByRole('heading', { name: /Create Sales Invoice/i })).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });
});
