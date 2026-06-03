import { randomUUID } from 'crypto';

import { stock_movements } from '@vyora/database';
import { CreateStockMovementInput, StockMovementDto, InventoryStockDto } from '@vyora/types';
import { eq, asc, sql } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

type DbStockMovement = typeof stock_movements.$inferSelect;

function mapToDto(entity: DbStockMovement): StockMovementDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    financialYearId: entity.financialYearId,
    productId: entity.productId,
    movementType: entity.movementType,
    referenceType: entity.referenceType,
    referenceId: entity.referenceId,
    quantityIn: entity.quantityIn,
    quantityOut: entity.quantityOut,
    rate: entity.rate,
    movementDate: entity.movementDate,
    remarks: entity.remarks,
    createdAt: entity.createdAt,
  };
}

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

  public async getProductLedger(productId: string): Promise<StockMovementDto[]> {
    const results = await this.db
      .select()
      .from(stock_movements)
      .where(eq(stock_movements.productId, productId))
      .orderBy(asc(stock_movements.movementDate))
      .all();

    return results.map(mapToDto);
  }

  public async getCurrentStock(productId: string): Promise<InventoryStockDto> {
    const result = await this.db
      .select({
        totalIn: sql<number>`SUM(${stock_movements.quantityIn})`,
        totalOut: sql<number>`SUM(${stock_movements.quantityOut})`,
      })
      .from(stock_movements)
      .where(eq(stock_movements.productId, productId))
      .get();

    if (!result) {
      return { productId, stock: 0 };
    }

    const totalIn = result.totalIn ? Number(result.totalIn) : 0;
    const totalOut = result.totalOut ? Number(result.totalOut) : 0;

    return { productId, stock: totalIn - totalOut };
  }
}
