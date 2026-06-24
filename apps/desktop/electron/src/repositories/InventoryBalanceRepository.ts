import { randomUUID } from 'crypto';

import { inventory_balances, products, units } from '@vyora/database';
import { InventoryBalanceDto, GlobalInventoryRowDto } from '@vyora/types';
import { eq, and } from 'drizzle-orm';

import { BaseRepository, DbTransaction, TransactionExecutor } from './BaseRepository';

type DbInventoryBalance = typeof inventory_balances.$inferSelect;

function mapToDto(entity: DbInventoryBalance): InventoryBalanceDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    financialYearId: entity.financialYearId,
    productId: entity.productId,
    currentQty: entity.currentQty,
    currentWacPaise: entity.currentWacPaise,
    currentValuePaise: entity.currentValuePaise,
    syncVersion: entity.syncVersion,
    updatedAt: entity.updatedAt,
  };
}

export class InventoryBalanceRepository extends BaseRepository {
  public async getBalance(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<InventoryBalanceDto | null> {
    const executor = tx || this.db;
    const result = await executor
      .select()
      .from(inventory_balances)
      .where(
        and(
          eq(inventory_balances.companyId, companyId),
          eq(inventory_balances.financialYearId, financialYearId),
          eq(inventory_balances.productId, productId),
        ),
      )
      .get();

    return result ? mapToDto(result) : null;
  }

  public async upsertBalance(
    companyId: string,
    financialYearId: string,
    productId: string,
    currentQty: number,
    currentWacPaise: number,
    currentValuePaise: number,
    tx?: DbTransaction,
  ): Promise<void> {
    const executeLogic = async (executor: TransactionExecutor) => {
      const existing = await executor
        .select()
        .from(inventory_balances)
        .where(
          and(
            eq(inventory_balances.companyId, companyId),
            eq(inventory_balances.financialYearId, financialYearId),
            eq(inventory_balances.productId, productId),
          ),
        )
        .get();

      if (existing) {
        await executor
          .update(inventory_balances)
          .set({
            currentQty,
            currentWacPaise,
            currentValuePaise,
            updatedAt: new Date(),
            syncVersion: existing.syncVersion + 1,
          })
          .where(eq(inventory_balances.id, existing.id));
      } else {
        await executor.insert(inventory_balances).values({
          id: randomUUID(),
          companyId,
          financialYearId,
          productId,
          currentQty,
          currentWacPaise,
          currentValuePaise,
          updatedAt: new Date(),
          syncVersion: 1,
        });
      }
    };

    if (tx) {
      await executeLogic(tx);
    } else {
      await this.db.transaction(async (innerTx) => {
        await executeLogic(innerTx);
      });
    }
  }

  public async getAllBalances(
    companyId: string,
    financialYearId: string,
  ): Promise<GlobalInventoryRowDto[]> {
    const results = await this.db
      .select({
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        unitId: units.id,
        unitShortName: units.shortName,
        currentQty: inventory_balances.currentQty,
        currentWacPaise: inventory_balances.currentWacPaise,
        currentValuePaise: inventory_balances.currentValuePaise,
      })
      .from(products)
      .leftJoin(units, eq(products.unitId, units.id))
      .leftJoin(
        inventory_balances,
        and(
          eq(products.id, inventory_balances.productId),
          eq(inventory_balances.companyId, companyId),
          eq(inventory_balances.financialYearId, financialYearId),
        ),
      )
      .where(eq(products.companyId, companyId))
      .all();

    return results.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      productSku: row.productSku,
      unitId: row.unitId!,
      unitShortName: row.unitShortName!,
      currentQty: row.currentQty ?? 0,
      currentWacPaise: row.currentWacPaise ?? 0,
      currentValuePaise: row.currentValuePaise ?? 0,
    }));
  }

  public async getNegativeBalances(
    companyId: string,
    financialYearId: string,
  ): Promise<GlobalInventoryRowDto[]> {
    const results = await this.getAllBalances(companyId, financialYearId);
    return results.filter((row) => row.currentQty < 0);
  }

  public async deleteBalance(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx?: DbTransaction,
  ): Promise<void> {
    const executor = tx || this.db;
    await executor
      .delete(inventory_balances)
      .where(
        and(
          eq(inventory_balances.companyId, companyId),
          eq(inventory_balances.financialYearId, financialYearId),
          eq(inventory_balances.productId, productId),
        ),
      );
  }

  // --- SYNC VARIANTS FOR TRANSACTION SAFETY ---

  public getBalanceSync(
    companyId: string,
    financialYearId: string,
    productId: string,
    tx: TransactionExecutor,
  ): InventoryBalanceDto | null {
    const result = tx
      .select()
      .from(inventory_balances)
      .where(
        and(
          eq(inventory_balances.companyId, companyId),
          eq(inventory_balances.financialYearId, financialYearId),
          eq(inventory_balances.productId, productId),
        ),
      )
      .get();

    return result ? mapToDto(result) : null;
  }

  public upsertBalanceSync(
    companyId: string,
    financialYearId: string,
    productId: string,
    currentQty: number,
    currentWacPaise: number,
    currentValuePaise: number,
    tx: TransactionExecutor,
  ): void {
    const existing = tx
      .select()
      .from(inventory_balances)
      .where(
        and(
          eq(inventory_balances.companyId, companyId),
          eq(inventory_balances.financialYearId, financialYearId),
          eq(inventory_balances.productId, productId),
        ),
      )
      .get();

    if (existing) {
      tx.update(inventory_balances)
        .set({
          currentQty,
          currentWacPaise,
          currentValuePaise,
          updatedAt: new Date(),
          syncVersion: existing.syncVersion + 1,
        })
        .where(eq(inventory_balances.id, existing.id))
        .run();
    } else {
      tx.insert(inventory_balances)
        .values({
          id: randomUUID(),
          companyId,
          financialYearId,
          productId,
          currentQty,
          currentWacPaise,
          currentValuePaise,
          updatedAt: new Date(),
          syncVersion: 1,
        })
        .run();
    }
  }
}
