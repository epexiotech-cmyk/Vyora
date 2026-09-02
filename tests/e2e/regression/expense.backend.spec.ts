import { test, expect } from '../fixtures/electron.fixture';

test.describe('Regression: Expense Backend API', () => {
  test('Creating miscellaneous expense works without tax ID or unit ID errors', async ({
    mainWindow,
    database,
  }) => {
    // 1. Fetch the company that was just created by the Setup Wizard
    const company = database.queryOne<{ id: string }>(
      'SELECT id FROM companies ORDER BY created_at DESC LIMIT 1',
    );
    expect(company).toBeDefined();

    // 2. Fetch a payment account (Epexio Cash)
    const paymentAccounts = database.query<{ id: string }>(
      'SELECT id FROM payment_accounts WHERE company_id = ? LIMIT 1',
      [company?.id],
    );
    const paymentAccountId = paymentAccounts[0]?.id;

    // 3. Create a dummy expense preset
    const presetId = '44444444-4444-4444-4444-444444444444';
    database.execute(
      'INSERT INTO expense_presets (id, company_id, name, ledger_id, is_active, sync_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        presetId,
        company?.id,
        'Advertising',
        'dummy-ledger-id', // Assuming ledger isn't validated deeply or we can use a dummy
        1,
        1,
        new Date().getTime(),
        new Date().getTime(),
      ],
    );

    // 4. Create expense using IPC to bypass UI flakiness and directly test the service contract
    const expenseId = await mainWindow.evaluate(
      async ({ paymentAccountId, presetId }) => {
        // @ts-expect-error window.vyora is not fully typed in this context
        return await window.vyora.purchases.create({
          documentType: 'EXPENSE',
          purchaseDate: new Date(),
          paymentAccountId: paymentAccountId,
          isMiscellaneous: true,
          subtotal: 1000,
          taxAmount: 0,
          grandTotal: 1000,
          status: 'DRAFT',
          lines: [
            {
              expensePresetId: presetId,
              quantity: 1,
              rate: 1000,
              taxableAmount: 1000,
              taxAmount: 0,
              lineTotal: 1000,
              // taxId and unitId are intentionally left undefined
            },
          ],
        });
      },
      { companyId: company!.id, paymentAccountId, presetId },
    );

    expect(expenseId).toBeDefined();
    expect(typeof expenseId).toBe('string');

    // 5. Verify the persisted DB record
    const expense = database.queryOne<{
      supplier_id: string;
      supplier_name: string;
      supplier_gstin: string | null;
    }>('SELECT supplier_id, supplier_name, supplier_gstin FROM purchases WHERE id = ?', [
      expenseId,
    ]);

    expect(expense).toBeDefined();

    // The supplierName MUST be 'Miscellaneous Expenses'
    expect(expense!.supplier_name).toBe('Miscellaneous Expenses');

    // The supplierGstin MUST be null since the system supplier has no GSTIN
    expect(expense!.supplier_gstin).toBeNull();

    // Verify the supplier record exists and isSystem=1
    const supplier = database.queryOne<{ is_system: number; gstin: string | null }>(
      'SELECT is_system, gstin FROM suppliers WHERE id = ?',
      [expense!.supplier_id],
    );

    expect(supplier).toBeDefined();
    expect(supplier!.is_system).toBe(1);
    expect(supplier!.gstin).toBeNull();

    // Verify the line items have no dummy tax or unit IDs
    const line = database.queryOne<{ tax_id: string | null; unit_short_name: string | null }>(
      'SELECT tax_id, unit_short_name FROM purchase_lines WHERE purchase_invoice_id = ?',
      [expenseId],
    );

    expect(line).toBeDefined();
    // They should be null/empty, not the dummy UUIDs
    expect(line!.tax_id).toBeNull();
    // In PurchaseService, if line.unitId is not provided, unitShortName would be undefined during insert, which translates to NULL in db
    expect(line!.unit_short_name).toBeNull();
  });
});
