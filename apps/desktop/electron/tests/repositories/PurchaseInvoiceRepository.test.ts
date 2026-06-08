import { purchase_invoices, purchase_invoice_items } from '@vyora/database';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
    isPackaged: false,
  },
}));

import { PurchaseInvoiceRepository } from '../../src/repositories/PurchaseInvoiceRepository';
import { dbService } from '../../src/services/database/DatabaseService';
import { createTestDatabase, seedBaseEntities } from '../setup/createTestDatabase';

describe('PurchaseInvoiceRepository Integration Tests', () => {
  let dbSetup: ReturnType<typeof createTestDatabase>;
  let repo: PurchaseInvoiceRepository;
  let seeds: Awaited<ReturnType<typeof seedBaseEntities>>;

  beforeAll(async () => {
    dbSetup = createTestDatabase();
    vi.spyOn(dbService, 'getDb').mockReturnValue(dbSetup.db);
    repo = new PurchaseInvoiceRepository();
    seeds = await seedBaseEntities(dbSetup.db);
  });

  afterAll(() => {
    dbSetup.sqlite.close();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await dbSetup.db.delete(purchase_invoice_items).execute();
    await dbSetup.db.delete(purchase_invoices).execute();
  });

  describe('SECTION G — PURCHASE REPOSITORY', () => {
    it('creates purchase invoice and persists items', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        supplierId: seeds.customerId, // Using customer seed for supplier
        invoiceDate: new Date(),
        subtotal: 2000,
        taxAmount: 360,
        grandTotal: 2360,
        status: 'DRAFT',
        supplierInvoiceNumber: 'SUP-999',
        items: [
          {
            productId: seeds.productId,
            unitId: seeds.unitId,
            taxId: seeds.taxId,
            quantity: 20,
            rate: 100,
            taxableAmount: 2000,
            taxAmount: 360,
            lineTotal: 2360,
          },
        ],
      });

      expect(invoiceId).toBeDefined();

      const saved = await repo.getById(invoiceId);
      expect(saved).not.toBeNull();
      expect(saved?.supplierInvoiceNumber).toBe('SUP-999');
      expect(saved?.grandTotal).toBe(2360);
      expect(saved?.items).toHaveLength(1);
      expect(saved?.items![0].productId).toBe(seeds.productId);

      await repo.getByInvoiceNumber(seeds.companyId, seeds.fyId, saved!.invoiceNumber ?? '');
      // For purchase invoices, invoiceNumber might be null initially if not generated, let's see.
      // Actually DRAFT invoices don't have it unless explicitly set. We didn't set it. So it's null.
    });

    it('list() and getByInvoiceNumber() retrieves correct data', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        supplierId: seeds.customerId,
        invoiceDate: new Date(),
        subtotal: 500,
        status: 'SUBMITTED',
        invoiceNumber: 'PINV-01',
      });

      const byNumber = await repo.getByInvoiceNumber(seeds.companyId, seeds.fyId, 'PINV-01');
      expect(byNumber?.id).toBe(invoiceId);

      const list = await repo.list({ companyId: seeds.companyId });
      expect(list).toHaveLength(1);
    });

    it('update() and replaceItems() works correctly', async () => {
      const { invoiceId } = await repo.createInvoice({
        companyId: seeds.companyId,
        financialYearId: seeds.fyId,
        supplierId: seeds.customerId,
        invoiceDate: new Date(),
        status: 'DRAFT',
      });

      await repo.update(invoiceId, { status: 'CANCELLED' });
      await repo.replaceItems(invoiceId, [
        {
          productId: seeds.productId,
          unitId: seeds.unitId,
          taxId: seeds.taxId,
          quantity: 100,
          rate: 10,
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

      const saved = await repo.getById(invoiceId);
      expect(saved?.status).toBe('CANCELLED');
      expect(saved?.items).toHaveLength(1);
      expect(saved?.items![0].quantity).toBe(100);
    });
  });
});
