import { randomUUID } from 'crypto';

import { inventory_balances, stock_movements } from '@vyora/database';
import { asc } from 'drizzle-orm';

import { DbTransaction } from '../../main/database/adapters/IDatabaseAdapter';
import { dbService } from '../database/DatabaseService';

export interface IntegrityMismatch {
  productId: string;
  financialYearId: string;
  expectedQty: number;
  actualQty: number;
}

export class InventoryAdminService {
  /**
   * Recalculates inventory balances from the ground up by replaying all stock movements.
   * Modifies the database.
   */
  public async rebuildInventorySync(): Promise<void> {
    const db = dbService.getDb();

    return db.transaction((tx: DbTransaction) => {
      // 1. Clear all existing balances
      tx.delete(inventory_balances).run();

      // 2. Fetch all movements ordered by time
      const allMovements = tx
        .select()
        .from(stock_movements)
        .orderBy(asc(stock_movements.movementDate), asc(stock_movements.createdAt))
        .all();

      // 3. Track running balances per (companyId, financialYearId, productId)
      const stateMap = new Map<
        string,
        {
          companyId: string;
          financialYearId: string;
          productId: string;
          currentQty: number;
          currentWacPaise: number;
          currentValuePaise: number;
        }
      >();

      for (const movement of allMovements) {
        const key = `${movement.companyId}:${movement.financialYearId}:${movement.productId}`;
        if (!stateMap.has(key)) {
          stateMap.set(key, {
            companyId: movement.companyId,
            financialYearId: movement.financialYearId,
            productId: movement.productId,
            currentQty: 0,
            currentWacPaise: 0,
            currentValuePaise: 0,
          });
        }

        const state = stateMap.get(key)!;

        // Replicate logic from InventoryEngine.applyMovementToBalanceSync
        if (movement.quantityIn > 0) {
          if (state.currentQty < 0) {
            state.currentWacPaise = movement.rate;
          } else {
            const totalInValue = movement.quantityIn * movement.rate;
            const newValue = state.currentValuePaise + totalInValue;
            const newQty = state.currentQty + movement.quantityIn;
            state.currentWacPaise = newQty > 0 ? Math.round(newValue / newQty) : 0;
          }
          state.currentQty += movement.quantityIn;
          state.currentValuePaise = state.currentQty * state.currentWacPaise;
        } else if (movement.quantityOut > 0) {
          const totalOutValue = movement.quantityOut * movement.rate;
          state.currentValuePaise -= totalOutValue;
          state.currentQty -= movement.quantityOut;
          state.currentWacPaise =
            state.currentQty > 0
              ? Math.round(state.currentValuePaise / state.currentQty)
              : state.currentWacPaise;
          state.currentValuePaise = state.currentQty * state.currentWacPaise;
        }
      }

      // 4. Insert computed balances back into DB
      for (const state of stateMap.values()) {
        tx.insert(inventory_balances)
          .values({
            id: randomUUID(),
            companyId: state.companyId,
            financialYearId: state.financialYearId,
            productId: state.productId,
            currentQty: state.currentQty,
            currentWacPaise: state.currentWacPaise,
            currentValuePaise: state.currentValuePaise,
            updatedAt: new Date(),
            syncVersion: 1,
          })
          .run();
      }
    });
  }

  /**
   * Compares the database balances against a recalculation from stock movements.
   * Does NOT modify the database. Returns a list of mismatches.
   */
  public async checkInventoryIntegritySync(): Promise<IntegrityMismatch[]> {
    const db = dbService.getDb();

    // Calculate expected balances
    const allMovements = db.select().from(stock_movements).all();
    const expectedMap = new Map<string, number>();

    for (const movement of allMovements) {
      const key = `${movement.financialYearId}:${movement.productId}`;
      const current = expectedMap.get(key) || 0;
      expectedMap.set(key, current + movement.quantityIn - movement.quantityOut);
    }

    // Fetch actual balances
    const actualBalances = db.select().from(inventory_balances).all();
    const mismatches: IntegrityMismatch[] = [];

    for (const balance of actualBalances) {
      const key = `${balance.financialYearId}:${balance.productId}`;
      const expected = expectedMap.get(key) || 0;

      if (balance.currentQty !== expected) {
        mismatches.push({
          productId: balance.productId,
          financialYearId: balance.financialYearId,
          expectedQty: expected,
          actualQty: balance.currentQty,
        });
      }
      expectedMap.delete(key);
    }

    // Any remaining expected balances where actual is missing
    for (const [key, expected] of expectedMap.entries()) {
      if (expected !== 0) {
        const [fy, prod] = key.split(':');
        mismatches.push({
          productId: prod,
          financialYearId: fy,
          expectedQty: expected,
          actualQty: 0,
        });
      }
    }

    return mismatches;
  }
}

export const inventoryAdminService = new InventoryAdminService();
