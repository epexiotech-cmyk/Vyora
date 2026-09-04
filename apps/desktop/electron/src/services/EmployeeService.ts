import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeDto,
  SearchEmployeesOptions,
  EmployeeListDto,
} from '@vyora/types';

import { EmployeeRepository } from '../repositories/EmployeeRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class EmployeeService {
  private repo = new EmployeeRepository();

  public async search(options: SearchEmployeesOptions): Promise<EmployeeListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.search(companyId, options);
  }

  public async getById(id: string): Promise<EmployeeDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateEmployeeInput): Promise<EmployeeDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    // Validate employee code uniqueness
    const existing = await this.repo.getByCode(data.employeeCode, companyId);
    if (existing) {
      throw new Error('Employee code already exists for this company');
    }

    return this.repo.create(companyId, data);
  }

  public async update(id: string, data: UpdateEmployeeInput): Promise<EmployeeDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    // Check reporting manager loop logic if needed
    if (data.reportingManagerId === id) {
      throw new Error('An employee cannot be their own reporting manager');
    }

    if (data.employeeCode) {
      const existing = await this.repo.getByCode(data.employeeCode, companyId);
      if (existing && existing.id !== id) {
        throw new Error('Employee code already exists for this company');
      }
    }

    return this.repo.update(id, companyId, data);
  }

  public async deactivate(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    await this.repo.deactivate(id, companyId);
  }

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }
}

export const employeeService = new EmployeeService();
