import { test, expect } from '../fixtures/electron.fixture';

test.describe('Stress: Database', () => {
  test('Insert 1000 items rapidly via IPC to test SQLite locks and performance', async ({
    mainWindow,
    database,
  }) => {
    test.setTimeout(120000); // 2 minutes

    // 1. Prepare Unit and Tax
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

    // 2. Perform bulk creation via IPC
    const companyId = company?.id;
    if (!companyId) throw new Error('Company not found');

    const result = await mainWindow.evaluate(
      async ({ companyId }) => {
        const startTime = performance.now();
        const promises = [];
        let successCount = 0;
        let errorCount = 0;

        interface ExtendedWindow extends Window {
          vyora: {
            db: {
              products: {
                create: (payload: unknown) => Promise<{ success: boolean; error?: unknown }>;
              };
            };
          };
        }

        for (let i = 0; i < 1000; i++) {
          promises.push(
            (window as unknown as ExtendedWindow).vyora.db.products
              .create({
                companyId,
                name: `Stress Item ${i}`,
                itemType: 'INVENTORY_ITEM',
                description: `Test item ${i}`,
                unitId: '11111111-1111-4111-8111-111111111111',
                taxId: '22222222-2222-4222-8222-222222222222',
                purchasePrice: 100,
                salePrice: 200,
                isActive: true,
              })
              .then((res: { success: boolean; error?: unknown }) => {
                if (res.success) successCount++;
                else {
                  errorCount++;
                  console.error(res.error);
                }
              })
              .catch((e: unknown) => {
                errorCount++;
                console.error(e);
              }),
          );

          if (promises.length >= 100) {
            await Promise.all(promises);
            promises.length = 0;
          }
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }

        const endTime = performance.now();
        return { successCount, errorCount, durationMs: endTime - startTime };
      },
      { companyId },
    );

    // eslint-disable-next-line no-console
    console.log(
      `Stress test results: ${result.successCount} succeeded, ${result.errorCount} failed in ${result.durationMs}ms`,
    );

    expect(result.errorCount).toBe(0);
    expect(result.successCount).toBe(1000);

    // 3. Verify in SQLite
    const count = database.queryOne<{ count: number }>('SELECT count(*) as count FROM products');
    expect(count?.count).toBe(1000);
  });
});
