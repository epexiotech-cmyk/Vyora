import {
  CreateWorkLocationInput,
  SearchWorkLocationsOptions,
  WorkLocationDto,
  WorkLocationListDto,
  UpdateWorkLocationInput,
  createWorkLocationSchema,
  updateWorkLocationSchema,
  searchWorkLocationsSchema,
} from '@vyora/types';

import { WorkLocationRepository } from '../repositories/WorkLocationRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class WorkLocationService {
  private repo = new WorkLocationRepository();

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  public async search(options: SearchWorkLocationsOptions): Promise<WorkLocationListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchWorkLocationsSchema.parse(options);
    return this.repo.search(companyId, validOptions);
  }

  public async getAll(): Promise<WorkLocationDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<WorkLocationDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateWorkLocationInput): Promise<WorkLocationDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createWorkLocationSchema.parse(data);

    // Prevent duplicates
    const existing = await this.repo.getByName(companyId, validData.name);
    if (existing) {
      throw new Error('A work location with this name already exists.');
    }

    return this.repo.create(companyId, validData);
  }

  public async update(id: string, data: UpdateWorkLocationInput): Promise<WorkLocationDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateWorkLocationSchema.parse(data);

    if (validData.name) {
      const existing = await this.repo.getByName(companyId, validData.name);
      if (existing && existing.id !== id) {
        throw new Error('A work location with this name already exists.');
      }
    }

    return this.repo.update(id, companyId, validData);
  }

  public async deactivate(id: string): Promise<void> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    await this.repo.deactivate(id, companyId);
  }
}

export const workLocationService = new WorkLocationService();
