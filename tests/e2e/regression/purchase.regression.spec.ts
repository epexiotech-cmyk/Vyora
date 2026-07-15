import { test, expect } from '../fixtures/electron.fixture';
import { DashboardPage } from '../pages/DashboardPage';
import { ItemPage } from '../pages/ItemPage';
import { PurchaseInvoicePage } from '../pages/PurchaseInvoicePage';
import { SupplierPage } from '../pages/SupplierPage';

test.describe('Regression: Purchase Workflow', () => {
  test('End-to-End Purchase lifecycle and DB verification', async ({ mainWindow, database }) => {
    const dashboard = new DashboardPage(mainWindow);

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

    // 1. Create Prerequisites (Supplier & Item)
    await dashboard.navigateTo('Suppliers');
    const supplierPage = new SupplierPage(mainWindow);
    await supplierPage.createSupplier('Tech Vendor', 'tech@vendor.com', '1234567890');

    await dashboard.navigateTo('Items');
    const itemPage = new ItemPage(mainWindow);
    await itemPage.createItem('RAM 16GB', 3000);

    // 2. Create Draft Purchase
    await dashboard.navigateTo('Purchases');
    const purchasePage = new PurchaseInvoicePage(mainWindow);
    await purchasePage.createDraftPurchase('Tech Vendor', 'RAM 16GB', 10, 3000); // 30,000 Total

    // UI Verification
    await purchasePage.verifyStatus('DRAFT');

    // DB Verification (Draft should NOT affect inventory or ledgers)
    let stock = database.queryOne<{ qty: number }>(
      'SELECT current_qty as qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['RAM 16GB'],
    );
    expect(stock?.qty || 0).toBe(0);

    // 3. Submit Purchase
    await purchasePage.submitPurchase();
    await purchasePage.verifyStatus('SUBMITTED');

    // DB Verification (Stock should increase by 10)
    stock = database.queryOne<{ qty: number }>(
      'SELECT current_qty as qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['RAM 16GB'],
    );
    expect(stock?.qty).toBe(10);

    // DB Verification (Accounting Voucher created)
    const vouchers = database.query<{ id: string; type: string }>(
      'SELECT * FROM vouchers WHERE voucher_type = ? AND is_cancelled = 0',
      ['Purchase'],
    );
    expect(vouchers.length).toBeGreaterThan(0);

    // 4. Cancel Purchase
    await purchasePage.cancelPurchase();
    await purchasePage.verifyStatus('CANCELLED');

    // DB Verification (Stock should revert to 0)
    stock = database.queryOne<{ qty: number }>(
      'SELECT current_qty as qty FROM inventory_balances ib JOIN products p ON ib.product_id = p.id WHERE p.name = ?',
      ['RAM 16GB'],
    );
    expect(stock?.qty).toBe(0);

    // DB Verification (Reversal Journal created - i.e. voucher is cancelled or reversal created)
    const cancelledVouchers = database.query<{ id: string }>(
      'SELECT * FROM vouchers WHERE voucher_type = ? AND is_cancelled = 1',
      ['Purchase'],
    );
    expect(cancelledVouchers.length).toBeGreaterThan(0);
  });
});
