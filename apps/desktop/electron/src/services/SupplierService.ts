import {
  SupplierProfileDto,
  CreateSupplierInput,
  UpdateSupplierInput,
  SearchSuppliersOptions,
  SupplierListDto,
  createSupplierSchema,
  updateSupplierSchema,
} from '@vyora/types';

import { SupplierRepository } from '../repositories/SupplierRepository';

import { companyContextService } from './CompanyContextService';
import { numberingEngineService } from './NumberingEngineService';
import { partyLedgerIntegrationService } from './PartyLedgerIntegrationService';

export class SupplierService {
  private supplierRepo = new SupplierRepository();

  public async searchSuppliers(options: SearchSuppliersOptions): Promise<SupplierListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.supplierRepo.search(companyId, options);
  }

  public async getSupplierById(id: string): Promise<SupplierProfileDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.supplierRepo.getById(id, companyId);
  }

  public async createSupplier(data: CreateSupplierInput): Promise<SupplierProfileDto> {
    const validatedData = createSupplierSchema.parse(data);
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.supplierRepo.transaction(async (tx) => {
      const supplierCode = await numberingEngineService.generateNextNumber(
        companyId,
        '',
        'SUPPLIER',
        tx,
      );

      const supplier = await this.supplierRepo.create(
        companyId,
        {
          ...validatedData,
          supplierCode,
        },
        tx,
      );

      partyLedgerIntegrationService.createSupplierLedgerSync(companyId, supplier, tx);

      return supplier;
    });
  }

  public async updateSupplier(id: string, data: UpdateSupplierInput): Promise<SupplierProfileDto> {
    const validatedData = updateSupplierSchema.parse(data);
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.supplierRepo.update(id, companyId, validatedData);
  }

  public async deactivateSupplier(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.supplierRepo.deactivate(id, companyId);
  }
}

export const supplierService = new SupplierService();
