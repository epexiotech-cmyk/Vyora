import { test, expect } from '../fixtures/electron.fixture';
import { CustomerPage } from '../pages/CustomerPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ItemPage } from '../pages/ItemPage';
import { SalesInvoicePage } from '../pages/SalesInvoicePage';

test.describe('Regression: Sales Workflow', () => {
  test('End-to-End Sales lifecycle, Duplicate Prevention, and DB verification', async ({
    mainWindow,
    database,
  }) => {
    const dashboard = new DashboardPage(mainWindow);

    // 1. Create Prerequisites (Customer & Item with stock)

    // Fetch the company that was just created by the Setup Wizard
    const company = database.queryOne<{ id: string }>(
      'SELECT id FROM companies ORDER BY created_at DESC LIMIT 1',
    );
    database.execute(
      'INSERT INTO units (id, company_id, name, short_name, is_active, sync_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        '11111111-1111-4111-8111-111111111111',
        company?.id,
        'Numbers',
        'NOS',
        1,
        1,
        new Date().getTime(),
        new Date().getTime(),
      ],
    );
    database.execute(
      'INSERT INTO taxes (id, company_id, name, tax_type, rate, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        '22222222-2222-4222-8222-222222222222',
        company?.id,
        'GST 18%',
        'GST',
        18,
        1,
        new Date().getTime(),
      ],
    );

    await dashboard.navigateTo('Customers');
    const customerPage = new CustomerPage(mainWindow);
    await customerPage.createCustomer('Retail Client', 'retail@client.com', '1234567890');

    await dashboard.navigateTo('Items');
    const itemPage = new ItemPage(mainWindow);
    await itemPage.createItem('Keyboard', 1000);

    // Fetch the auto-generated Product for the Keyboard
    const product = database.queryOne<{ id: string }>('SELECT id FROM products WHERE name = ?', [
      'Keyboard',
    ]);

    // Fetch the financial year created by the system
    const fy = database.queryOne<{ id: string }>(
      'SELECT id FROM financial_years WHERE company_id = ?',
      [company?.id],
    );

    // Seed initial stock so we can sell it
    database.execute(
      'INSERT INTO inventory_balances (id, company_id, financial_year_id, product_id, current_qty, current_wac_paise, current_value_paise, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['inv-1', company?.id, fy?.id, product?.id, 100, 50000, 5000000, new Date().getTime()],
    );

    // 2. Create Draft Sales Invoice
    await dashboard.navigateTo('Sales');
    const salesPage = new SalesInvoicePage(mainWindow);
    await salesPage.createDraftSales('Retail Client', 'Keyboard', 5, 1000); // 5,000 Total

    await salesPage.verifyStatus('DRAFT');

    // DB Verification (Draft should NOT affect inventory)
    let stock = database.queryOne<{ current_qty: number }>(
      'SELECT current_qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['Keyboard'],
    );
    expect(stock?.current_qty).toBe(100);

    // 3. Submit Sales (with race condition test)
    await salesPage.rapidDoubleSubmitSales();
    await salesPage.verifyStatus('SUBMITTED');

    // DB Verification (Stock should decrease by exactly 5, NOT 10 despite double click)
    stock = database.queryOne<{ current_qty: number }>(
      'SELECT current_qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['Keyboard'],
    );
    expect(stock?.current_qty).toBe(95);

    // DB Verification (Accounting Voucher created - exactly one)
    const vouchers = database.query<{ id: string }>(
      'SELECT * FROM vouchers WHERE reference_type = ?',
      ['SALES_INVOICE'],
    );
    expect(vouchers.length).toBe(1);

    // Verify DB Inventory Stock movement (exactly one outbound movement)
    const movements = database.query<{ id: string }>(
      'SELECT * FROM stock_movements WHERE reference_type = ?',
      ['SALES_INVOICE'],
    );
    expect(movements.length).toBe(1);

    // 4. Cancel Sales
    await salesPage.cancelSales();
    await salesPage.verifyStatus('CANCELLED');

    // DB Verification (Stock should revert to 100)
    stock = database.queryOne<{ current_qty: number }>(
      'SELECT current_qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['Keyboard'],
    );
    expect(stock?.current_qty).toBe(100);
  });
});
