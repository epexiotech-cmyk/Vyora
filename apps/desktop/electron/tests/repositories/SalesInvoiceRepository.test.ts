import { sales_invoices, sales_invoice_items } from '@vyora/database';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
    isPackaged: false,
  },
}));

import { SalesInvoiceRepository } from '../../src/repositories/SalesInvoiceRepository';
import { dbService } from '../../src/services/database/DatabaseService';
import { createTestDatabase, seedBaseEntities } from '../setup/createTestDatabase';

describe('SalesInvoiceRepository Integration Tests', () => {
  let dbSetup: ReturnType<typeof createTestDatabase>;
  let repo: SalesInvoiceRepository;
  let seeds: Awaited<ReturnType<typeof seedBaseEntities>>;

  beforeAll(async () => {
    dbSetup = createTestDatabase();
    vi.spyOn(dbService, 'getDb').mockReturnValue(dbSetup.db);
    repo = new SalesInvoiceRepository();
  });

  afterAll(() => {
    dbSetup.sqlite.close();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // Clear out invoice tables before each test
    await dbSetup.db.delete(sales_invoice_items).execute();
    await dbSetup.db.delete(sales_invoices).execute();

    // Seed or ensure base entities exist (we can just seed once, but doing it in beforeEach ensures clean state if we wiped all tables)
    // Actually, we only deleted invoices. So we only need to seed once in beforeAll.
  });

  beforeAll(async () => {
    seeds = await seedBaseEntities(dbSetup.db);
  });

  describe('SECTION A — SALES INVOICE REPOSITORY', () => {
    it('createInvoice() persists header, items, and relationships', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        subtotal: 1000,
        taxAmount: 180,
        grandTotal: 1180,
        status: 'DRAFT',
        items: [
          {
            productId: seeds.productId,
            unitId: seeds.unitId,
            taxId: seeds.taxId,
            quantity: 10,
            rate: 100,
            taxableAmount: 1000,
            taxAmount: 180,
            lineTotal: 1180,
          },
        ],
      });

      expect(invoiceId).toBeDefined();

      const saved = await repo.getById(invoiceId);
      expect(saved).not.toBeNull();
      expect(saved?.grandTotal).toBe(1180);
      expect(saved?.items).toHaveLength(1);
      expect(saved?.items![0].productId).toBe(seeds.productId);
    });
  });

  describe('SECTION B — REPLACE ITEMS', () => {
    it('replaceItems() removes existing items and inserts new ones with no orphans', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'DRAFT',
        items: [
          {
            productId: seeds.productId,
            unitId: seeds.unitId,
            taxId: seeds.taxId,
            quantity: 1,
            rate: 100,
            taxableAmount: 100,
            taxAmount: 18,
            lineTotal: 118,
          },
        ],
      });

      let saved = await repo.getById(invoiceId);
      expect(saved?.items).toHaveLength(1);

      // Replace items
      await repo.replaceItems(invoiceId, [
        {
          productId: seeds.productId,
          unitId: seeds.unitId,
          taxId: seeds.taxId,
          quantity: 5,
          rate: 100,
          taxableAmount: 500,
          taxAmount: 90,
          lineTotal: 590,
          description: null,
          hsnCode: null,
          discountAmount: 0,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 18,
          igstAmount: 90,
          taxNameSnapshot: 'GST 18%',
          taxRateSnapshot: 18,
        },
        {
          productId: seeds.productId,
          unitId: seeds.unitId,
          taxId: seeds.taxId,
          quantity: 2,
          rate: 50,
          taxableAmount: 100,
          taxAmount: 18,
          lineTotal: 118,
          description: null,
          hsnCode: null,
          discountAmount: 0,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 18,
          igstAmount: 18,
          taxNameSnapshot: 'GST 18%',
          taxRateSnapshot: 18,
        },
      ]);

      saved = await repo.getById(invoiceId);
      expect(saved?.items).toHaveLength(2);
      expect(saved?.items![0].quantity).toBe(5);

      // Verify no orphans in DB
      const allItems = await dbSetup.db.select().from(sales_invoice_items).all();
      expect(allItems).toHaveLength(2); // Only the 2 new ones exist globally
    });
  });

  describe('SECTION C — UPDATE', () => {
    it('update() modifies header fields properly', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'DRAFT',
        subtotal: 100,
      });

      await repo.update(invoiceId, {
        subtotal: 500,
        status: 'SUBMITTED',
        invoiceNumber: 'INV-001',
      });

      const saved = await repo.getById(invoiceId);
      expect(saved?.subtotal).toBe(500);
      expect(saved?.status).toBe('SUBMITTED');
      expect(saved?.invoiceNumber).toBe('INV-001');
    });
  });

  describe('SECTION D — LISTING', () => {
    it('list() filters and paginates correctly', async () => {
      // Create 3 invoices
      await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date('2025-05-01'),
        status: 'DRAFT',
      });
      await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date('2025-05-02'),
        status: 'DRAFT',
      });
      await repo.createInvoice({
        companyId: 'other-company',
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date('2025-05-03'),
        status: 'DRAFT',
      });

      // List by companyId
      const listA = await repo.list({ companyId: seeds.companyId });
      expect(listA).toHaveLength(2);
      // Descending order check
      expect(listA[0].invoiceDate?.getTime()).toBeGreaterThanOrEqual(
        listA[1].invoiceDate!.getTime(),
      );

      // Pagination
      const listB = await repo.list({ companyId: seeds.companyId, limit: 1, offset: 1 });
      expect(listB).toHaveLength(1);
    });
  });

  describe('SECTION E — GET BY ID', () => {
    it('getById() returns full invoice with snapshots', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'SUBMITTED',
        companyNameSnapshot: 'Snapshot Co',
        items: [
          {
            productId: seeds.productId,
            unitId: seeds.unitId,
            taxId: seeds.taxId,
            quantity: 1,
            rate: 100,
            taxableAmount: 100,
            taxAmount: 18,
            lineTotal: 118,
            taxNameSnapshot: 'GST',
          },
        ],
      });

      const saved = await repo.getById(invoiceId);
      expect(saved?.id).toBe(invoiceId);
      expect(saved?.companyNameSnapshot).toBe('Snapshot Co');
      expect(saved?.items![0].taxNameSnapshot).toBe('GST');
    });
  });

  describe('SECTION H — TRANSACTION ROLLBACK', () => {
    it('rolls back completely on error within tx', async () => {
      const invoiceData = {
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'DRAFT',
      };

      try {
        await dbSetup.db.transaction(async (tx) => {
          await repo.createInvoice(invoiceData, tx);

          // Force failure
          throw new Error('Forced failure');
        });
      } catch (e: unknown) {
        expect((e as Error).message).toBe('Forced failure');
      }

      // Verify no invoices persist
      const list = await repo.list({ companyId: seeds.companyId });
      expect(list).toHaveLength(0);
    });
  });

  describe('SECTION I — CONCURRENCY', () => {
    it('handles concurrent updates cleanly without duplicates', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        customerId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'DRAFT',
        items: [
          {
            productId: seeds.productId,
            unitId: seeds.unitId,
            taxId: seeds.taxId,
            quantity: 1,
            rate: 100,
            taxableAmount: 100,
            taxAmount: 18,
            lineTotal: 118,
          },
        ],
      });

      const updateTask1 = repo.replaceItems(invoiceId, [
        {
          productId: seeds.productId,
          unitId: seeds.unitId,
          taxId: seeds.taxId,
          quantity: 5,
          rate: 100,
          taxableAmount: 500,
          taxAmount: 90,
          lineTotal: 590,
          description: null,
          hsnCode: null,
          discountAmount: 0,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 18,
          igstAmount: 90,
          taxNameSnapshot: 'GST 18%',
          taxRateSnapshot: 18,
        },
      ]);

      const updateTask2 = repo.replaceItems(invoiceId, [
        {
          productId: seeds.productId,
          unitId: seeds.unitId,
          taxId: seeds.taxId,
          quantity: 10,
          rate: 100,
          taxableAmount: 1000,
          taxAmount: 180,
          lineTotal: 1180,
          description: null,
          hsnCode: null,
          discountAmount: 0,
          cgstRate: 0,
          cgstAmount: 0,
          sgstRate: 0,
          sgstAmount: 0,
          igstRate: 18,
          igstAmount: 180,
          taxNameSnapshot: 'GST 18%',
          taxRateSnapshot: 18,
        },
      ]);

      // SQLite uses WAL mode by default if initialized, but inside better-sqlite3 concurrent writes on same thread execute sequentially via event loop.
      await Promise.all([updateTask1, updateTask2]);

      const saved = await repo.getById(invoiceId);
      // The exact winner depends on event loop order, but the critical requirement is NO duplicated records (i.e., we don't have 2 items now).
      expect(saved?.items).toHaveLength(1);
    });
  });
});
