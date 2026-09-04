import {
  CreateEmployeeTypeInput,
  SearchEmployeeTypesOptions,
  EmployeeTypeDto,
  EmployeeTypeListDto,
  UpdateEmployeeTypeInput,
  createEmployeeTypeSchema,
  updateEmployeeTypeSchema,
  searchEmployeeTypesSchema,
} from '@vyora/types';

import { EmployeeTypeRepository } from '../repositories/EmployeeTypeRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class EmployeeTypeService {
  private repo = new EmployeeTypeRepository();

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  public async search(options: SearchEmployeeTypesOptions): Promise<EmployeeTypeListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchEmployeeTypesSchema.parse(options);
    return this.repo.search(companyId, validOptions);
  }

  public async getAll(): Promise<EmployeeTypeDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<EmployeeTypeDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateEmployeeTypeInput): Promise<EmployeeTypeDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createEmployeeTypeSchema.parse(data);

    // Prevent duplicates
    const existing = await this.repo.getByName(companyId, validData.name);
    if (existing) {
      throw new Error('An employee type with this name already exists.');
    }

    return this.repo.create(companyId, validData, false); // User created, not system
  }

  public async update(id: string, data: UpdateEmployeeTypeInput): Promise<EmployeeTypeDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateEmployeeTypeSchema.parse(data);

    const target = await this.repo.getById(id, companyId);
    if (!target) throw new Error('Employee type not found');

    if (target.isSystem) {
      throw new Error('Cannot modify system employee types');
    }

    if (validData.name) {
      const existing = await this.repo.getByName(companyId, validData.name);
      if (existing && existing.id !== id) {
        throw new Error('An employee type with this name already exists.');
      }
    }

    return this.repo.update(id, companyId, validData);
  }

  public async deactivate(id: string): Promise<void> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const target = await this.repo.getById(id, companyId);
    if (!target) throw new Error('Employee type not found');

    if (target.isSystem) {
      throw new Error('Cannot deactivate system employee types');
    }

    await this.repo.deactivate(id, companyId);
  }
}

export const employeeTypeService = new EmployeeTypeService();
