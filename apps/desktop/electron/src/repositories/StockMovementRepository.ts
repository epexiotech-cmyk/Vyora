import { randomUUID } from 'crypto';

import { stock_movements } from '@vyora/database';
import { eq, asc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

export type CreateStockMovementInput = {
  companyId: string;
  financialYearId: string;
  productId: string;
  movementType: string;
  referenceType: string;
  referenceId: string;
  quantityIn: number;
  quantityOut: number;
  rate: number;
  movementDate: Date;
  remarks?: string | null;
};

export class StockMovementRepository extends BaseRepository {
  public async createMovement(
    data: CreateStockMovementInput,
    tx?: DbTransaction,
  ): Promise<{ movementId: string }> {
    const executeLogic = async (executor: TransactionExecutor) => {
      const movementId = randomUUID();
      const now = new Date();

      await executor.insert(stock_movements).values({
        ...data,
        id: movementId,
        createdAt: now,
      });

      return { movementId };
    };

    if (tx) {
      return await executeLogic(tx);
    } else {
      return await this.db.transaction(async (innerTx) => {
        return await executeLogic(innerTx);
      });
    }
  }

  public async getProductLedger(productId: string) {
    return await this.db
      .select()
      .from(stock_movements)
      .where(eq(stock_movements.productId, productId))
      .orderBy(asc(stock_movements.movementDate))
      .all();
  }

  public async getCurrentStock(productId: string): Promise<{ stock: number }> {
    const result = await this.db
      .select({
        totalIn: sql<number>`SUM(${stock_movements.quantityIn})`,
        totalOut: sql<number>`SUM(${stock_movements.quantityOut})`,
      })
      .from(stock_movements)
      .where(eq(stock_movements.productId, productId))
      .get();

    if (!result) {
      return { stock: 0 };
    }

    const totalIn = result.totalIn ? Number(result.totalIn) : 0;
    const totalOut = result.totalOut ? Number(result.totalOut) : 0;

    return { stock: totalIn - totalOut };
  }
}
