import {
  CreateDepartmentInput,
  SearchDepartmentsOptions,
  DepartmentDto,
  DepartmentListDto,
  UpdateDepartmentInput,
  createDepartmentSchema,
  updateDepartmentSchema,
  searchDepartmentsSchema,
} from '@vyora/types';

import { DepartmentRepository } from '../repositories/DepartmentRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class DepartmentService {
  private repo = new DepartmentRepository();

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  public async search(options: SearchDepartmentsOptions): Promise<DepartmentListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchDepartmentsSchema.parse(options);
    return this.repo.search(companyId, validOptions);
  }

  public async getAll(): Promise<DepartmentDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<DepartmentDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateDepartmentInput): Promise<DepartmentDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createDepartmentSchema.parse(data);

    // Prevent duplicates
    const existing = await this.repo.getByName(companyId, validData.name);
    if (existing) {
      throw new Error('A department with this name already exists.');
    }

    return this.repo.create(companyId, validData);
  }

  public async update(id: string, data: UpdateDepartmentInput): Promise<DepartmentDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateDepartmentSchema.parse(data);

    if (validData.name) {
      const existing = await this.repo.getByName(companyId, validData.name);
      if (existing && existing.id !== id) {
        throw new Error('A department with this name already exists.');
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

export const departmentService = new DepartmentService();
