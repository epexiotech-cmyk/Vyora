import { test } from '../fixtures/electron.fixture';
import { CustomerPage } from '../pages/CustomerPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ItemPage } from '../pages/ItemPage';
import { SupplierPage } from '../pages/SupplierPage';
// Assuming the company has already been setup via a global DB seed in a real scenario
// We'll proceed from the dashboard.

test.describe('Smoke: Masters CRUD', () => {
  test('Customer, Supplier, and Item CRUD operations', async ({ mainWindow, database }) => {
    const dashboard = new DashboardPage(mainWindow);

    // Prepare required masters for Item creation
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

    // 1. Customer CRUD
    await dashboard.navigateTo('Customers');
    const customerPage = new CustomerPage(mainWindow);
    await customerPage.createCustomer('Acme Corp', 'contact@acme.com', '9999999999');
    await customerPage.verifyCustomerExists('Acme Corp');

    // 2. Supplier CRUD
    await dashboard.navigateTo('Suppliers');
    const supplierPage = new SupplierPage(mainWindow);
    await supplierPage.createSupplier('Global Dist', 'sales@global.com', '8888888888');
    await supplierPage.verifySupplierExists('Global Dist');

    // 3. Item CRUD
    await dashboard.navigateTo('Items');
    const itemPage = new ItemPage(mainWindow);
    await itemPage.createItem('Server Rack', 5000);
    await itemPage.verifyItemExists('Server Rack');
  });
});
