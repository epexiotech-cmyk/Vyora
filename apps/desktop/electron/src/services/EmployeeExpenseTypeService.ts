import {
  CreateEmployeeExpenseTypeInput,
  SearchEmployeeExpenseTypesOptions,
  EmployeeExpenseTypeDto,
  EmployeeExpenseTypeListDto,
  UpdateEmployeeExpenseTypeInput,
  createEmployeeExpenseTypeSchema,
  updateEmployeeExpenseTypeSchema,
  searchEmployeeExpenseTypesSchema,
} from '@vyora/types';

import { EmployeeExpenseTypeRepository } from '../repositories/EmployeeExpenseTypeRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class EmployeeExpenseTypeService {
  private repo = new EmployeeExpenseTypeRepository();

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  public async search(
    options: SearchEmployeeExpenseTypesOptions,
  ): Promise<EmployeeExpenseTypeListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchEmployeeExpenseTypesSchema.parse(options);
    return this.repo.search(companyId, validOptions);
  }

  public async getAll(): Promise<EmployeeExpenseTypeDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<EmployeeExpenseTypeDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateEmployeeExpenseTypeInput): Promise<EmployeeExpenseTypeDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createEmployeeExpenseTypeSchema.parse(data);

    // Prevent duplicates
    const existing = await this.repo.getByName(companyId, validData.name);
    if (existing) {
      throw new Error('An employee expense type with this name already exists.');
    }

    return this.repo.create(companyId, validData, false);
  }

  public async update(
    id: string,
    data: UpdateEmployeeExpenseTypeInput,
  ): Promise<EmployeeExpenseTypeDto> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateEmployeeExpenseTypeSchema.parse(data);

    const target = await this.repo.getById(id, companyId);
    if (!target) throw new Error('Employee expense type not found');

    if (target.isSystem) {
      throw new Error('Cannot modify system expense types');
    }

    if (validData.name) {
      const existing = await this.repo.getByName(companyId, validData.name);
      if (existing && existing.id !== id) {
        throw new Error('An employee expense type with this name already exists.');
      }
    }

    return this.repo.update(id, companyId, validData);
  }

  public async deactivate(id: string): Promise<void> {
    this.checkAdminRole();
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const target = await this.repo.getById(id, companyId);
    if (!target) throw new Error('Employee expense type not found');

    if (target.isSystem) {
      throw new Error('Cannot deactivate system expense types');
    }

    await this.repo.deactivate(id, companyId);
  }
}

export const employeeExpenseTypeService = new EmployeeExpenseTypeService();
