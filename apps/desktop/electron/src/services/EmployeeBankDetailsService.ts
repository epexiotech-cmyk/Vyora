import {
  CreateEmployeeBankDetailInput,
  UpdateEmployeeBankDetailInput,
  EmployeeBankDetailDto,
} from '@vyora/types';

import { EmployeeBankDetailsRepository } from '../repositories/EmployeeBankDetailsRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class EmployeeBankDetailsService {
  private repo = new EmployeeBankDetailsRepository();

  public async getByEmployeeId(employeeId: string): Promise<EmployeeBankDetailDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getByEmployeeId(employeeId, companyId);
  }

  public async getById(id: string): Promise<EmployeeBankDetailDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getById(id, companyId);
  }

  public async create(
    employeeId: string,
    data: CreateEmployeeBankDetailInput,
  ): Promise<EmployeeBankDetailDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    return this.repo.create(employeeId, companyId, data);
  }

  public async update(
    id: string,
    data: UpdateEmployeeBankDetailInput,
  ): Promise<EmployeeBankDetailDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

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

export const employeeBankDetailsService = new EmployeeBankDetailsService();
