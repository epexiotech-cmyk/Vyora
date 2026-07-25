import path from 'path';

import * as dbSchema from '@vyora/database';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export const createTestDatabase = (): { db: dbSchema.VyoraDatabase; sqlite: Database.Database } => {
  const sqlite = new Database(':memory:');

  const db = drizzle(sqlite, {
    schema: dbSchema,
  });

  const migrationsFolder = path.resolve(__dirname, '../../../../../packages/database/drizzle');
  migrate(db, { migrationsFolder });

  return { db, sqlite };
};

export const seedBaseEntities = async (db: dbSchema.VyoraDatabase) => {
  const companyId = 'comp-123';
  const fyId = 'fy-123';
  const customerId = 'cust-123';
  const productId = 'prod-123';
  const unitId = 'unit-123';
  const taxId = 'tax-123';

  await db.insert(dbSchema.companies).values({
    id: companyId,
    legalName: 'Test Company',
    gstin: '24AAAAA0000A1Z5',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(dbSchema.financial_years).values({
    id: fyId,
    companyId,
    label: 'FY 25-26',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isActive: true,
  });

  await db.insert(dbSchema.customers).values({
    id: customerId,
    companyId,
    name: 'Test Customer',
    customerCode: 'CUST-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(dbSchema.units).values({
    id: unitId,
    companyId,
    name: 'Pieces',
    shortName: 'PCS',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(dbSchema.taxes).values({
    id: taxId,
    companyId,
    name: 'GST 18%',
    taxType: 'GST',
    rate: 18,
    isActive: true,
    createdAt: new Date(),
  });

  await db.insert(dbSchema.products).values({
    id: productId,
    companyId,
    name: 'Test Product',
    sku: 'PROD-001',
    itemType: 'INVENTORY_ITEM',
    unitId,
    taxId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { companyId, fyId, customerId, productId, unitId, taxId };
};
