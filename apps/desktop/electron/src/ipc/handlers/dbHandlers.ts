import { randomUUID } from 'crypto';

import { customers, products } from '@vyora/database';
import { Customer, InsertCustomer, Product, InsertProduct, ApiResponse } from '@vyora/types';
import { desc, eq } from 'drizzle-orm';
import { ipcMain } from 'electron';

import { dbService } from '../../services/database/DatabaseService';

export function registerCustomerHandlers() {
  ipcMain.handle(
    'db:customers:getAll',
    async (_event, _args?: unknown): Promise<ApiResponse<Customer[]>> => {
      try {
        const db = dbService.getDb();
        const result = await db.select().from(customers).orderBy(desc(customers.createdAt));
        return { success: true, data: result as Customer[] };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:customers:create',
    async (
      _event,
      data: Omit<InsertCustomer, 'id' | 'createdAt'>,
    ): Promise<ApiResponse<Customer>> => {
      try {
        const db = dbService.getDb();
        const id = randomUUID();
        const now = new Date();

        const newCustomer = {
          ...data,
          id,
          createdAt: now,
        } as InsertCustomer;

        await db.insert(customers).values(newCustomer);
        const created = await db.select().from(customers).where(eq(customers.id, id)).get();
        return { success: true, data: created as Customer };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}

export function registerProductHandlers() {
  ipcMain.handle(
    'db:products:getAll',
    async (_event, _args?: unknown): Promise<ApiResponse<Product[]>> => {
      try {
        const db = dbService.getDb();
        const result = await db.select().from(products).orderBy(desc(products.createdAt));
        return { success: true, data: result as Product[] };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:products:create',
    async (
      _event,
      data: Omit<InsertProduct, 'id' | 'createdAt'>,
    ): Promise<ApiResponse<Product>> => {
      try {
        const db = dbService.getDb();
        const id = randomUUID();
        const now = new Date();

        const newProduct = {
          ...data,
          id,
          createdAt: now,
        } as InsertProduct;

        await db.insert(products).values(newProduct);
        const created = await db.select().from(products).where(eq(products.id, id)).get();
        return { success: true, data: created as Product };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );
}
