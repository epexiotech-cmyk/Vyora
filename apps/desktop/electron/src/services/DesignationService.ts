import {
  CreateDesignationInput,
  SearchDesignationsOptions,
  DesignationDto,
  DesignationListDto,
  UpdateDesignationInput,
  createDesignationSchema,
  updateDesignationSchema,
  searchDesignationsSchema,
} from '@vyora/types';

import { DesignationRepository } from '../repositories/DesignationRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class DesignationService {
  private repo = new DesignationRepository();

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  public async search(options: SearchDesignationsOptions): Promise<DesignationListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchDesignationsSchema.parse(options);
    return this.repo.search(companyId, validOptions);
  }

  public async getAll(): Promise<DesignationDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<DesignationDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateDesignationInput): Promise<DesignationDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createDesignationSchema.parse(data);

    // Prevent duplicates
    const existing = await this.repo.getByName(companyId, validData.name);
    if (existing) {
      throw new Error('A designation with this name already exists.');
    }

    return this.repo.create(companyId, validData);
  }

  public async update(id: string, data: UpdateDesignationInput): Promise<DesignationDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateDesignationSchema.parse(data);

    if (validData.name) {
      const existing = await this.repo.getByName(companyId, validData.name);
      if (existing && existing.id !== id) {
        throw new Error('A designation with this name already exists.');
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

export const designationService = new DesignationService();
