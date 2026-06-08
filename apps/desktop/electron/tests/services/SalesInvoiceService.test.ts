import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoistedMocks = vi.hoisted(() => ({
  companyGetById: vi.fn(),
  taxFindAll: vi.fn(),
}));

import { gstCalculationService } from '../../src/services/GstCalculationService';
import { inventoryService } from '../../src/services/InventoryService';
import { numberingEngineService } from '../../src/services/NumberingEngineService';
import { SalesInvoiceService, StockValidationError } from '../../src/services/SalesInvoiceService';

// 1. Setup global mocks before importing the service
vi.mock('../../src/repositories', () => {
  return {
    SalesInvoiceRepository: class {
      createInvoice = vi.fn();
      getById = vi.fn();
      update = vi.fn();
      replaceItems = vi.fn();
      list = vi.fn();
    },
    StockMovementRepository: class {
      createMovement = vi.fn();
    },
    CompanyRepository: class {
      getById = hoistedMocks.companyGetById;
    },
    TaxRepository: class {
      findAllByCompany = hoistedMocks.taxFindAll;
    },
  };
});

vi.mock('../../src/services/database/DatabaseService', () => {
  return {
    dbService: {
      getDb: vi.fn().mockReturnValue({
        transaction: vi.fn().mockImplementation(async (callback) => {
          return await callback({}); // Mocked transaction object
        }),
      }),
    },
  };
});

vi.mock('../../src/services/GstCalculationService', () => {
  return {
    gstCalculationService: {
      calculate: vi.fn(),
    },
  };
});

vi.mock('../../src/services/InventoryService', () => {
  return {
    inventoryService: {
      checkStockAvailability: vi.fn(),
    },
  };
});

vi.mock('../../src/services/NumberingEngineService', () => {
  return {
    numberingEngineService: {
      generateNextNumber: vi.fn(),
    },
  };
});

describe('SalesInvoiceService', () => {
  let service: SalesInvoiceService;

  // Expose the mocked internal repositories to check calls
  let mockSalesInvoiceRepo: {
    createInvoice: import('vitest').Mock;
    getById: import('vitest').Mock;
    update: import('vitest').Mock;
    replaceItems: import('vitest').Mock;
    list: import('vitest').Mock;
  };
  let mockStockMovementRepo: { createMovement: import('vitest').Mock };

  beforeEach(() => {
    vi.clearAllMocks();
    hoistedMocks.companyGetById.mockReset();
    hoistedMocks.taxFindAll.mockReset();
    service = new SalesInvoiceService();
    // Using reflection to test internal instances securely without standard 'any'
    const srv = service as unknown as {
      salesInvoiceRepo: typeof mockSalesInvoiceRepo;
      stockMovementRepo: typeof mockStockMovementRepo;
    };
    mockSalesInvoiceRepo = srv.salesInvoiceRepo;
    mockStockMovementRepo = srv.stockMovementRepo;
  });

  describe('SECTION A — CREATE DRAFT', () => {
    it('creates draft invoice successfully and avoids GST/Stock execution', async () => {
      const mockInput = {
        companyId: 'comp1',
        financialYearId: 'fy1',
        status: 'DRAFT' as const,
        items: [{ productId: 'p1', quantity: 1, rate: 100 }],
      };

      mockSalesInvoiceRepo.createInvoice.mockResolvedValue({ invoiceId: 'inv1' });

      const result = await service.createInvoice(
        mockInput as unknown as import('@vyora/types').CreateSalesInvoiceInput,
      );

      expect(result.invoiceId).toBe('inv1');
      expect(mockSalesInvoiceRepo.createInvoice).toHaveBeenCalledWith(mockInput, expect.anything());
      expect(gstCalculationService.calculate).not.toHaveBeenCalled();
      expect(inventoryService.checkStockAvailability).not.toHaveBeenCalled();
      expect(mockStockMovementRepo.createMovement).not.toHaveBeenCalled();
    });

    it('rejects creation if status is not DRAFT', async () => {
      const mockInput = { status: 'SUBMITTED' as const };

      await expect(
        service.createInvoice(
          mockInput as unknown as import('@vyora/types').CreateSalesInvoiceInput,
        ),
      ).rejects.toThrowError(/should only be used for DRAFT status/);
    });
  });

  describe('SECTION B — UPDATE DRAFT', () => {
    it('updates header and replaces items successfully for DRAFT invoice', async () => {
      const mockInvoice = { id: 'inv1', status: 'DRAFT' };
      const mockPayload = {
        subtotal: 100,
        items: [{ productId: 'p1', quantity: 2 }],
      };

      mockSalesInvoiceRepo.getById.mockResolvedValueOnce(mockInvoice);
      mockSalesInvoiceRepo.getById.mockResolvedValueOnce({ ...mockInvoice, ...mockPayload });

      const result = await service.updateDraft(
        'inv1',
        mockPayload as unknown as import('@vyora/types').UpdateSalesInvoiceInput,
      );

      expect(mockSalesInvoiceRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ subtotal: 100 }),
        expect.anything(),
      );
      expect(mockSalesInvoiceRepo.replaceItems).toHaveBeenCalled();
      expect(result.subtotal).toBe(100);
      expect(gstCalculationService.calculate).not.toHaveBeenCalled();
    });

    it('rejects updates for SUBMITTED invoices', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1', status: 'SUBMITTED' });

      await expect(
        service.updateDraft(
          'inv1',
          {} as unknown as import('@vyora/types').UpdateSalesInvoiceInput,
        ),
      ).rejects.toThrowError(/Cannot update draft for invoice with status: SUBMITTED/);
    });

    it('rejects updates for CANCELLED invoices', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1', status: 'CANCELLED' });

      await expect(
        service.updateDraft(
          'inv1',
          {} as unknown as import('@vyora/types').UpdateSalesInvoiceInput,
        ),
      ).rejects.toThrowError(/Cannot update draft for invoice with status: CANCELLED/);
    });
  });

  describe('SECTION C — SUBMIT INVOICE', () => {
    it('executes full submission workflow including numbering, GST, and stock', async () => {
      const mockInvoice = {
        id: 'inv1',
        status: 'DRAFT',
        companyId: 'comp1',
        financialYearId: 'fy1',
        invoiceDate: new Date(),
        items: [{ productId: 'p1', quantity: 5, rate: 100 }],
      };

      mockSalesInvoiceRepo.getById.mockResolvedValue(mockInvoice);

      hoistedMocks.companyGetById.mockResolvedValue({
        id: 'comp1',
        name: 'Test Co',
        gstin: '24AAAAA0000A1Z5',
      });
      hoistedMocks.taxFindAll.mockResolvedValue([]);

      vi.mocked(gstCalculationService.calculate).mockReturnValue({
        subtotal: 500,
        discountAmount: 0,
        taxAmount: 25,
        roundOffAmount: 0,
        grandTotal: 525,
        items: [
          { productId: 'p1', quantity: 5, rate: 100, taxAmount: 25 },
        ] as unknown as import('../../src/services/GstCalculationService').GstCalculationItemOutput[],
      });

      vi.mocked(inventoryService.checkStockAvailability).mockResolvedValue({
        available: true,
        currentStock: 10,
      } as unknown as import('@vyora/types').StockValidationResultDto);
      vi.mocked(numberingEngineService.generateNextNumber).mockResolvedValue('INV-100');

      const result = await service.submitInvoice('inv1');

      expect(result.warnings).toEqual([]);

      // 1. GST Calc was called
      expect(gstCalculationService.calculate).toHaveBeenCalled();

      // 2. Pre-check stock called
      expect(inventoryService.checkStockAvailability).toHaveBeenCalledWith('comp1', 'p1', 5);

      // 3. Invoice Number generated
      expect(numberingEngineService.generateNextNumber).toHaveBeenCalledWith(
        'comp1',
        'fy1',
        'SALES_INVOICE',
        expect.anything(),
      );

      // 4. Stock Movement generated
      expect(mockStockMovementRepo.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ movementType: 'SALE', quantityOut: 5 }),
        expect.anything(),
      );

      // 5. Invoice header updated to SUBMITTED and snapshots saved
      expect(mockSalesInvoiceRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({
          status: 'SUBMITTED',
          invoiceNumber: 'INV-100',
          companyNameSnapshot: 'Test Co',
          grandTotal: 525,
        }),
        expect.anything(),
      );
    });

    it('throws StockValidationError if stock is insufficient during precheck', async () => {
      const mockInvoice = {
        id: 'inv1',
        status: 'DRAFT',
        companyId: 'comp1',
        items: [{ productId: 'p1', quantity: 15 }],
      };
      mockSalesInvoiceRepo.getById.mockResolvedValue(mockInvoice);

      hoistedMocks.companyGetById.mockResolvedValue({ id: 'comp1', name: 'Test Co' });

      vi.mocked(gstCalculationService.calculate).mockReturnValue({
        items: [],
      } as unknown as import('../../src/services/GstCalculationService').GstCalculationInvoiceOutput<
        import('../../src/services/GstCalculationService').GstCalculationItemOutput
      >);
      vi.mocked(inventoryService.checkStockAvailability).mockResolvedValue({
        available: false,
        currentStock: 10,
      } as unknown as import('@vyora/types').StockValidationResultDto);

      await expect(service.submitInvoice('inv1')).rejects.toThrowError(StockValidationError);
      expect(mockSalesInvoiceRepo.update).not.toHaveBeenCalled();
    });

    it('rejects submission if invoice is not DRAFT (Line 111)', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({
        id: 'inv1',
        status: 'SUBMITTED',
        items: [{ productId: 'p1', quantity: 5 }],
      });

      await expect(service.submitInvoice('inv1')).rejects.toThrowError(
        /Cannot submit invoice in status SUBMITTED/,
      );
    });

    it('rejects submission if invoice has no items (Line 115)', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({
        id: 'inv1',
        status: 'DRAFT',
        items: [],
      });

      await expect(service.submitInvoice('inv1')).rejects.toThrowError(
        /Cannot submit an invoice with no items/,
      );
    });

    it('captures advisory warnings and handles stock failure strictly inside transaction (Lines 187, 192)', async () => {
      const mockInvoice = {
        id: 'inv1',
        status: 'DRAFT',
        companyId: 'comp1',
        financialYearId: 'fy1',
        invoiceDate: new Date(),
        items: [{ productId: 'p1', quantity: 5, rate: 100 }],
      };

      mockSalesInvoiceRepo.getById.mockResolvedValue(mockInvoice);
      hoistedMocks.companyGetById.mockResolvedValue({
        id: 'comp1',
        name: 'Test Co',
      });
      hoistedMocks.taxFindAll.mockResolvedValue([]);

      vi.mocked(gstCalculationService.calculate).mockReturnValue({
        subtotal: 500,
        discountAmount: 0,
        taxAmount: 0,
        roundOffAmount: 0,
        grandTotal: 500,
        items: [
          { productId: 'p1', quantity: 5, rate: 100, taxAmount: 0 },
        ] as unknown as import('../../src/services/GstCalculationService').GstCalculationItemOutput[],
      } as unknown as import('../../src/services/GstCalculationService').GstCalculationInvoiceOutput<
        import('../../src/services/GstCalculationService').GstCalculationItemOutput
      >);

      // Precheck succeeds, but with a warning (Line 187 precheck equivalent)
      vi.mocked(inventoryService.checkStockAvailability).mockResolvedValueOnce({
        available: true,
        currentStock: 5,
        warningOnly: true,
        warningMessage: 'Low stock',
      } as unknown as import('@vyora/types').StockValidationResultDto);

      // Inside transaction, it actually fails (Line 192)
      vi.mocked(inventoryService.checkStockAvailability).mockResolvedValueOnce({
        available: false,
        currentStock: 0,
      } as unknown as import('@vyora/types').StockValidationResultDto);

      await expect(service.submitInvoice('inv1')).rejects.toThrowError(StockValidationError);
    });
  });

  describe('SECTION D — CANCEL INVOICE', () => {
    it('cancels submitted invoice and restores stock via SALE_RETURN', async () => {
      const mockInvoice = {
        id: 'inv1',
        status: 'SUBMITTED',
        companyId: 'comp1',
        financialYearId: 'fy1',
        invoiceNumber: 'INV-100',
        items: [{ productId: 'p1', quantity: 5, rate: 100 }],
      };
      mockSalesInvoiceRepo.getById.mockResolvedValue(mockInvoice);

      await service.cancelInvoice('inv1');

      // Restores stock
      expect(mockStockMovementRepo.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          movementType: 'SALE_RETURN',
          quantityIn: 5,
          quantityOut: 0,
        }),
        expect.anything(),
      );

      // Updates status
      expect(mockSalesInvoiceRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ status: 'CANCELLED' }),
        expect.anything(),
      );
    });

    it('rejects cancellation of DRAFT invoice', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1', status: 'DRAFT' });
      await expect(service.cancelInvoice('inv1')).rejects.toThrowError(
        /Cannot cancel invoice in status DRAFT/,
      );
    });

    it('rejects cancellation of CANCELLED invoice', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1', status: 'CANCELLED' });
      await expect(service.cancelInvoice('inv1')).rejects.toThrowError(
        /Cannot cancel invoice in status CANCELLED/,
      );
    });
  });

  describe('SECTION E — SNAPSHOT IMMUTABILITY', () => {
    it('verifies that submitted invoice explicitly writes snapshot fields', async () => {
      const mockInvoice = {
        id: 'inv1',
        status: 'DRAFT',
        companyId: 'comp1',
        items: [{ productId: 'p1', quantity: 5 }],
      };
      mockSalesInvoiceRepo.getById.mockResolvedValue(mockInvoice);

      hoistedMocks.companyGetById.mockResolvedValue({
        id: 'comp1',
        name: 'Immutable Co',
        gstin: '24AAAAA0000A1Z5',
        address: '123 Wall St',
      });

      vi.mocked(gstCalculationService.calculate).mockReturnValue({
        items: [],
      } as unknown as import('../../src/services/GstCalculationService').GstCalculationInvoiceOutput<
        import('../../src/services/GstCalculationService').GstCalculationItemOutput
      >);
      vi.mocked(inventoryService.checkStockAvailability).mockResolvedValue({
        available: true,
        currentStock: 100,
      } as unknown as import('@vyora/types').StockValidationResultDto);

      await service.submitInvoice('inv1');

      expect(mockSalesInvoiceRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({
          companyNameSnapshot: 'Immutable Co',
          companyGstinSnapshot: '24AAAAA0000A1Z5',
          companyAddressSnapshot: '123 Wall St',
          companyStateCodeSnapshot: '24',
        }),
        expect.anything(),
      );
    });
  });

  describe('SECTION F — TRANSACTION ROLLBACK', () => {
    it('aborts persistence if GST calculation throws', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({
        id: 'inv1',
        status: 'DRAFT',
        companyId: 'comp1',
        items: [{ productId: 'p1', quantity: 5 }],
      });
      hoistedMocks.companyGetById.mockResolvedValue({ id: 'comp1' });

      vi.mocked(gstCalculationService.calculate).mockImplementation(() => {
        throw new Error('GST Failure');
      });

      await expect(service.submitInvoice('inv1')).rejects.toThrowError('GST Failure');

      // The transaction boundary handles DB level rollbacks, but we verify we didn't call repo methods
      expect(mockSalesInvoiceRepo.update).not.toHaveBeenCalled();
      expect(mockStockMovementRepo.createMovement).not.toHaveBeenCalled();
    });
  });

  describe('SECTION G — REGRESSION PROTECTION', () => {
    it('reconciles subtotal + tax = grandTotal correctly through update flow', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1', status: 'DRAFT' });

      const payload = {
        subtotal: 1000,
        discountAmount: 100,
        taxAmount: 162,
        roundOffAmount: 0,
        grandTotal: 1062,
        // no items
      };

      await service.updateDraft(
        'inv1',
        payload as unknown as import('@vyora/types').UpdateSalesInvoiceInput,
      );

      expect(mockSalesInvoiceRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({
          subtotal: 1000,
          discountAmount: 100,
          taxAmount: 162,
          grandTotal: 1062,
        }),
        expect.anything(),
      );
      expect(mockSalesInvoiceRepo.replaceItems).not.toHaveBeenCalled();
    });
  });

  describe('SECTION H — QUERIES', () => {
    it('getInvoiceById fetches invoice', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue({ id: 'inv1' });
      const result = await service.getInvoiceById('inv1');
      expect(result.id).toBe('inv1');
    });

    it('getInvoiceById throws if not found', async () => {
      mockSalesInvoiceRepo.getById.mockResolvedValue(null);
      await expect(service.getInvoiceById('inv1')).rejects.toThrowError('Invoice not found');
    });

    it('listInvoices delegates to repo', async () => {
      mockSalesInvoiceRepo.list.mockResolvedValue([]);
      const result = await service.listInvoices({});
      expect(result).toEqual([]);
      expect(mockSalesInvoiceRepo.list).toHaveBeenCalledWith({});
    });
  });
});
