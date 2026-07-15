import { Page } from '@playwright/test';

export class CompanyPage {
  constructor(private readonly page: Page) {}

  async createCompany(name: string, pan: string, gst: string, currency: string) {
    await this.page.getByTestId('create-company-btn').click();
    await this.page.getByTestId('company-name-input').fill(name);
    await this.page.getByTestId('company-pan-input').fill(pan);
    await this.page.getByTestId('company-gst-input').fill(gst);

    // Select currency
    await this.page.getByTestId('currency-select').click();
    await this.page.getByTestId(`currency-option-${currency}`).click();

    await this.page.getByTestId('save-company-btn').click();
  }

  async selectCompany(name: string) {
    await this.page.getByTestId(`select-company-${name}`).click();
  }
}
