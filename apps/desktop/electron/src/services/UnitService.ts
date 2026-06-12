import {
  CreateUnitInput,
  SearchUnitsOptions,
  UnitDto,
  UnitListDto,
  UpdateUnitInput,
  createUnitSchema,
  updateUnitSchema,
  searchUnitsSchema,
} from '@vyora/types';

import { UnitRepository } from '../repositories/UnitRepository';

import { companyContextService } from './CompanyContextService';

class UnitService {
  private unitRepo = new UnitRepository();

  public async search(options: SearchUnitsOptions): Promise<UnitListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchUnitsSchema.parse(options);
    return this.unitRepo.search(companyId, validOptions);
  }

  public async getAll(): Promise<UnitDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.unitRepo.getAll(companyId);
  }

  public async getById(id: string): Promise<UnitDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.unitRepo.getById(id, companyId);
  }

  public async create(data: CreateUnitInput): Promise<UnitDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createUnitSchema.parse(data);

    // Prevent duplicates
    const existing = await this.unitRepo.getByNameOrShortName(
      companyId,
      validData.name,
      validData.shortName,
    );
    if (existing) {
      if (existing.name.toLowerCase() === validData.name.toLowerCase()) {
        throw new Error('A unit with this name already exists.');
      }
      if (existing.shortName.toLowerCase() === validData.shortName.toLowerCase()) {
        throw new Error('A unit with this short name already exists.');
      }
    }

    return this.unitRepo.create(companyId, validData);
  }

  public async update(id: string, data: UpdateUnitInput): Promise<UnitDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateUnitSchema.parse(data);

    // Prevent duplicates
    if (validData.name || validData.shortName) {
      const existingName = validData.name ?? '';
      const existingShortName = validData.shortName ?? '';

      if (existingName || existingShortName) {
        const existing = await this.unitRepo.getByNameOrShortName(
          companyId,
          existingName,
          existingShortName,
        );
        if (existing && existing.id !== id) {
          if (validData.name && existing.name.toLowerCase() === validData.name.toLowerCase()) {
            throw new Error('A unit with this name already exists.');
          }
          if (
            validData.shortName &&
            existing.shortName.toLowerCase() === validData.shortName.toLowerCase()
          ) {
            throw new Error('A unit with this short name already exists.');
          }
        }
      }
    }

    return this.unitRepo.update(id, companyId, validData);
  }

  public async deactivate(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    await this.unitRepo.deactivate(id, companyId);
  }
}

export const unitService = new UnitService();
