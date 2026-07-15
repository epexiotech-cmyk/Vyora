import { test, expect } from '../fixtures/electron.fixture';

test.describe('Regression: Accounting Workflow', () => {
  test('Verify Trial Balance Reconciliation', async ({ mainWindow, database }) => {
    expect(mainWindow).toBeDefined(); // Used to ensure Electron boots up
    // 1. Verify Trial Balance sums to zero across all active ledgers
    const reconciliation = database.queryOne<{ diff: number }>(`
      SELECT SUM(debit_amount) - SUM(credit_amount) as diff FROM voucher_entries
    `);

    // Accounting equation strictly enforced
    expect(reconciliation?.diff || 0).toBe(0);
  });
});
