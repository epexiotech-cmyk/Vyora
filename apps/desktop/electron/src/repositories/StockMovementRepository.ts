import { randomUUID } from 'crypto';

import { stock_movements } from '@vyora/database';
import { CreateStockMovementInput, StockMovementDto, InventoryStockDto } from '@vyora/types';
import { eq, and, sql, asc, lte } from 'drizzle-orm';

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

  public async getCurrentStock(productId: string, tx?: DbTransaction): Promise<InventoryStockDto> {
    const executor = tx || this.db;
    const result = await executor
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

  public async getMovementByReference(
    referenceType: string,
    referenceId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<StockMovementDto | null> {
    const executor = tx || this.db;
    const movement = await executor
      .select()
      .from(stock_movements)
      .where(
        and(
          eq(
            stock_movements.referenceType,
            referenceType as unknown as (typeof stock_movements.$inferSelect)['referenceType'],
          ),
          eq(stock_movements.referenceId, referenceId),
          eq(stock_movements.productId, productId),
        ),
      )
      .get();
    return movement ? mapToDto(movement) : null;
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  public createMovementSync(
    data: CreateStockMovementInput,
    tx: TransactionExecutor,
  ): { movementId: string } {
    const movementId = randomUUID();
    const now = new Date();

    tx.insert(stock_movements)
      .values({
        ...data,
        id: movementId,
        createdAt: now,
      })
      .run();

    return { movementId };
  }

  public getMovementsByReferenceSync(
    referenceType: string,
    referenceId: string,
    tx: TransactionExecutor,
  ): StockMovementDto[] {
    const movements = tx
      .select()
      .from(stock_movements)
      .where(
        and(
          eq(
            stock_movements.referenceType,
            referenceType as unknown as (typeof stock_movements.$inferSelect)['referenceType'],
          ),
          eq(stock_movements.referenceId, referenceId),
        ),
      )
      .all();

    return movements.map(mapToDto);
  }

  public async getMovementsByReference(
    referenceType: string,
    referenceId: string,
    tx?: DbTransaction,
  ): Promise<StockMovementDto[]> {
    const executor = tx || this.db;
    const movements = await executor
      .select()
      .from(stock_movements)
      .where(
        and(
          eq(
            stock_movements.referenceType,
            referenceType as unknown as (typeof stock_movements.$inferSelect)['referenceType'],
          ),
          eq(stock_movements.referenceId, referenceId),
        ),
      )
      .all();
    return movements.map(mapToDto);
  }

  public async getReturnedTotalsForMovement(
    referenceType: string,
    referenceId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<{ returnedQty: number; returnedAmount: number }> {
    const executor = tx || this.db;
    const result = await executor
      .select({
        returnedQty: sql<number>`SUM(${stock_movements.quantityIn})`,
      })
      .from(stock_movements)
      .where(
        and(
          eq(
            stock_movements.referenceType,
            referenceType as unknown as (typeof stock_movements.$inferSelect)['referenceType'],
          ),
          eq(stock_movements.referenceId, referenceId),
          eq(stock_movements.productId, productId),
          eq(stock_movements.movementType, 'SALE_RETURN'),
        ),
      )
      .get();

    return {
      returnedQty: result?.returnedQty ? Number(result.returnedQty) : 0,
      returnedAmount: 0,
    };
  }

  public async getPurchaseReturnedTotalsForMovement(
    referenceType: string,
    referenceId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<{ returnedQty: number; returnedAmount: number }> {
    const executor = tx || this.db;
    const result = await executor
      .select({
        returnedQty: sql<number>`SUM(${stock_movements.quantityOut})`,
      })
      .from(stock_movements)
      .where(
        and(
          eq(
            stock_movements.referenceType,
            referenceType as unknown as (typeof stock_movements.$inferSelect)['referenceType'],
          ),
          eq(stock_movements.referenceId, referenceId),
          eq(stock_movements.productId, productId),
          eq(stock_movements.movementType, 'PURCHASE_RETURN'),
        ),
      )
      .get();

    return {
      returnedQty: result?.returnedQty ? Number(result.returnedQty) : 0,
      returnedAmount: 0,
    };
  }

  public async getAllDistinctBalancesKeys(
    tx?: DbTransaction,
  ): Promise<{ companyId: string; financialYearId: string; productId: string }[]> {
    const executor = tx || this.db;
    const results = await executor
      .select({
        companyId: stock_movements.companyId,
        financialYearId: stock_movements.financialYearId,
        productId: stock_movements.productId,
      })
      .from(stock_movements)
      .groupBy(
        stock_movements.companyId,
        stock_movements.financialYearId,
        stock_movements.productId,
      )
      .all();
    return results;
  }

  // --- REPORTING EXTENSIONS ---

  public async getBulkStockMovements(
    companyId: string,
    financialYearId: string,
    asOfDate?: Date,
    productId?: string,
  ) {
    let conditions: import('drizzle-orm').SQL<unknown> = and(
      eq(stock_movements.companyId, companyId),
      eq(stock_movements.financialYearId, financialYearId),
    )!;

    if (asOfDate) {
      conditions = and(conditions, lte(stock_movements.movementDate, asOfDate))!;
    }
    if (productId) {
      conditions = and(conditions, eq(stock_movements.productId, productId))!;
    }

    return this.db
      .select({
        id: stock_movements.id,
        productId: stock_movements.productId,
        movementType: stock_movements.movementType,
        referenceType: stock_movements.referenceType,
        referenceId: stock_movements.referenceId,
        quantityIn: stock_movements.quantityIn,
        quantityOut: stock_movements.quantityOut,
        rate: stock_movements.rate,
        movementDate: stock_movements.movementDate,
        remarks: stock_movements.remarks,
        createdAt: stock_movements.createdAt,
      })
      .from(stock_movements)
      .where(conditions)
      .orderBy(asc(stock_movements.movementDate), asc(stock_movements.id))
      .all();
  }
}
