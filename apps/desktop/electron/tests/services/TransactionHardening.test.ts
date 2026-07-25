import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('./') },
}));

vi.mock('../../src/services/DocumentNumberingService', () => ({
  documentNumberingService: {
    generateNextNumberSync: vi.fn().mockReturnValue('PUR-1001'),
  },
}));

import { companyContextService } from '../../src/services/CompanyContextService';
import { dbService } from '../../src/services/database/DatabaseService';
import { inventoryService } from '../../src/services/InventoryService';
import { purchaseService } from '../../src/services/PurchaseService';

describe('Transaction Hardening Verification (Phase 6.2F) - Mock DB', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTx: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ id: 'mock-id', name: 'Mock', rate: 18 }),
      all: vi.fn().mockResolvedValue([{ id: 'mock-line-id' }]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(true),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => await cb(mockTx)),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ stock: 50, totalIn: 100, totalOut: 50 }),
      all: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(dbService, 'getDb').mockReturnValue(mockDb);
    vi.spyOn(companyContextService, 'getActiveCompany').mockReturnValue('comp-123');
  });

  it('1. Create Purchase Invoice - verifies no nested transaction errors', async () => {
    const payload = {
      financialYearId: '123e4567-e89b-12d3-a456-426614174000',
      supplierId: '123e4567-e89b-12d3-a456-426614174001',
      supplierInvoiceNumber: 'INV-001',
      purchaseDate: new Date(),
      subtotal: 1000,
      discountAmount: 0,
      taxAmount: 180,
      roundOffAmount: 0,
      grandTotal: 1180,
      status: 'DRAFT' as const,
      isReverseCharge: false,
      lines: [
        {
          productId: '123e4567-e89b-12d3-a456-426614174002',
          unitId: '123e4567-e89b-12d3-a456-426614174003',
          taxId: '123e4567-e89b-12d3-a456-426614174004',
          quantity: 10,
          rate: 100,
          discountAmount: 0,
          taxableAmount: 1000,
          taxAmount: 180,
          lineTotal: 1180,
        },
      ],
    };

    await purchaseService.create(payload);

    // CRITICAL ASSERTION:
    // The top-level transaction should be opened EXACTLY ONCE.
    // If the nested transaction defect still existed, this would be called TWICE.
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);

    // The insert operations should happen on the transaction object (mockTx), NOT the base db.
    expect(mockTx.insert).toHaveBeenCalled();
  });

  it('2. Update Purchase Invoice - verifies no nested top-level tx', async () => {
    await purchaseService.updateDraft({
      id: '123e4567-e89b-12d3-a456-426614174005',
      subtotal: 2000,
      grandTotal: 2360,
    });

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.update).toHaveBeenCalled();
  });

  it('3. Soft Delete Purchase Invoice', async () => {
    await purchaseService.delete('123e4567-e89b-12d3-a456-426614174005');

    // Deactivate uses transaction directly
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.update).toHaveBeenCalled();
  });

  it('4. Inventory Flow - Queries work with and without tx', async () => {
    // Without tx
    await inventoryService.getCurrentStock('prod-123');
    expect(mockDb.select).toHaveBeenCalled(); // Should use base DB
  });
});
