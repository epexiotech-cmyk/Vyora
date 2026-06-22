import { stock_movements } from '@vyora/database';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
    isPackaged: false,
  },
}));

import { StockMovementRepository } from '../../src/repositories/StockMovementRepository';
import { dbService } from '../../src/services/database/DatabaseService';
import { createTestDatabase, seedBaseEntities } from '../setup/createTestDatabase';

describe('StockMovementRepository Integration Tests', () => {
  let dbSetup: ReturnType<typeof createTestDatabase>;
  let repo: StockMovementRepository;
  let seeds: Awaited<ReturnType<typeof seedBaseEntities>>;

  beforeAll(async () => {
    dbSetup = createTestDatabase();
    vi.spyOn(dbService, 'getDb').mockReturnValue(dbSetup.db);
    repo = new StockMovementRepository();
    seeds = await seedBaseEntities(dbSetup.db);
  });

  afterAll(() => {
    dbSetup.sqlite.close();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await dbSetup.db.delete(stock_movements).execute();
  });

  describe('SECTION F — STOCK MOVEMENTS', () => {
    it('creates movement and affects stock correctly', async () => {
      // 1. Initial stock is 0
      const initial = await repo.getCurrentStock(seeds.productId);
      expect(initial.stock).toBe(0);

      // 2. Add some stock (PURCHASE)
      await repo.createMovement({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        productId: seeds.productId,
        movementType: 'PURCHASE',
        referenceType: 'PURCHASE_INVOICE',
        referenceId: 'ref-1',
        quantityIn: 50,
        quantityOut: 0,
        rate: 100,
        movementDate: new Date(),
      });

      let current = await repo.getCurrentStock(seeds.productId);
      expect(current.stock).toBe(50);

      // 3. Remove stock (SALE)
      await repo.createMovement({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        productId: seeds.productId,
        movementType: 'SALE',
        referenceType: 'SALES_INVOICE',
        referenceId: 'ref-2',
        quantityIn: 0,
        quantityOut: 15,
        rate: 150,
        movementDate: new Date(),
      });

      current = await repo.getCurrentStock(seeds.productId);
      expect(current.stock).toBe(35);

      // 4. Reverse sale (SALE_RETURN)
      await repo.createMovement({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        productId: seeds.productId,
        movementType: 'SALE_RETURN',
        referenceType: 'SALES_INVOICE',
        referenceId: 'ref-2',
        quantityIn: 15, // Return goes into IN
        quantityOut: 0,
        rate: 150,
        movementDate: new Date(),
      });

      current = await repo.getCurrentStock(seeds.productId);
      expect(current.stock).toBe(50);

      // 5. Verify ledger
      const ledger = await repo.getProductLedger(seeds.productId);
      expect(ledger).toHaveLength(3);
      expect(ledger[0].movementType).toBe('PURCHASE');
      expect(ledger[1].movementType).toBe('SALE');
      expect(ledger[2].movementType).toBe('SALE_RETURN');
    });

    it('getCurrentStock supports transaction injection', async () => {
      await dbSetup.db
        .transaction(async (tx) => {
          // Add inside tx
          await repo.createMovement(
            {
              companyId: seeds.companyId,
              financialYearId: seeds.fyId,
              productId: seeds.productId,
              movementType: 'OPENING_BALANCE',
              referenceType: 'MANUAL',
              referenceId: 'ref',
              quantityIn: 100,
              quantityOut: 0,
              rate: 0,
              movementDate: new Date(),
            },
            tx,
          );

          // Fetch inside tx
          const stock = await repo.getCurrentStock(seeds.productId, tx);
          expect(stock.stock).toBe(100);

          // Let's force rollback so it doesn't affect DB
          throw new Error('Rollback');
        })
        .catch((e) => {
          expect(e.message).toBe('Rollback');
        });

      // Outside tx, stock should be 0 because we rolled back
      const current = await repo.getCurrentStock(seeds.productId);
      expect(current.stock).toBe(0);
    });
  });
});
