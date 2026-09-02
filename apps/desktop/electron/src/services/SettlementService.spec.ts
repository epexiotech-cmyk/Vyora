import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { SettlementService } from './SettlementService';

vi.mock('../repositories/SettlementRepository');
vi.mock('../repositories/SalesInvoiceRepository');
vi.mock('../repositories/PurchaseRepository');
vi.mock('./database/DatabaseService');
vi.mock('./CompanyContextService');
vi.mock('./FinancialYearContextService');
vi.mock('./DocumentNumberingService');

describe('SettlementService', () => {
  let service: SettlementService;

  beforeEach(() => {
    service = new SettlementService();
    vi.resetAllMocks();

    vi.mocked(companyContextService.getActiveCompany).mockReturnValue('company-1');
    vi.mocked(financialYearContextService.getActiveFinancialYear).mockReturnValue({
      id: 'fy-1',
    } as unknown as ReturnType<typeof financialYearContextService.getActiveFinancialYear>);
    vi.mocked(documentNumberingService.generateNextNumberSync).mockReturnValue('SET-001');

    vi.mocked(dbService.getDb).mockReturnValue({
      transaction: vi.fn((cb) =>
        cb({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          get: vi.fn(),
        }),
      ),
    } as unknown as ReturnType<typeof dbService.getDb>);
  });

  it('rejects negative payment amounts', async () => {
    await expect(
      service.createSettlement({
        settlementDate: new Date(),
        partyType: 'CUSTOMER',
        partyId: randomUUID(),
        amount: -100,
        paymentMode: 'CASH',
        paymentAccountId: randomUUID(),
        allocations: [],
      }),
    ).rejects.toThrow('Settlement amount must be greater than zero');
  });

  it('rejects allocation exceeding settlement amount', async () => {
    await expect(
      service.createSettlement({
        settlementDate: new Date(),
        partyType: 'CUSTOMER',
        partyId: randomUUID(),
        amount: 100,
        paymentMode: 'CASH',
        paymentAccountId: randomUUID(),
        allocations: [
          {
            documentType: 'SALES_INVOICE',
            documentId: randomUUID(),
            allocatedAmount: 150,
          },
        ],
      }),
    ).rejects.toThrow('Total allocated amount cannot exceed settlement amount');
  });
});
