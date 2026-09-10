import {
  WeeklyOffPolicyDto,
  CreateWeeklyOffPolicyInput,
  UpdateWeeklyOffPolicyInput,
  SearchWeeklyOffPoliciesOptions,
  WeeklyOffPolicyListDto,
} from '@vyora/types';

import { WeeklyOffPolicyRepository } from '../repositories/WeeklyOffPolicyRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { employeeTypeService } from './EmployeeTypeService';

class WeeklyOffPolicyService {
  private repo = new WeeklyOffPolicyRepository();

  public async search(options: SearchWeeklyOffPoliciesOptions): Promise<WeeklyOffPolicyListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.search(companyId, options);
  }

  public async getAll(): Promise<WeeklyOffPolicyDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<WeeklyOffPolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    const item = await this.repo.getById(id, companyId);
    if (!item) {
      throw new Error('WeeklyOffPolicy not found');
    }
    return item;
  }

  public async create(data: CreateWeeklyOffPolicyInput): Promise<WeeklyOffPolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const et = await employeeTypeService.getById(data.employeeTypeId);
    if (!et) throw new Error('Invalid employee type or belongs to another company');

    const existing = await this.repo.getByUniqueContext(
      companyId,
      data.employeeTypeId,
      data.dayOfWeek,
    );
    if (existing) {
      throw new Error('A weekly off policy for this employee type and day of week already exists');
    }

    return this.repo.create(companyId, data);
  }

  public async update(id: string, data: UpdateWeeklyOffPolicyInput): Promise<WeeklyOffPolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    if (data.employeeTypeId || data.dayOfWeek !== undefined) {
      const existing = await this.repo.getById(id, companyId);
      if (existing) {
        const employeeTypeId = data.employeeTypeId || existing.employeeTypeId;
        const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : existing.dayOfWeek;

        if (data.employeeTypeId) {
          const et = await employeeTypeService.getById(data.employeeTypeId);
          if (!et) throw new Error('Invalid employee type or belongs to another company');
        }

        if (employeeTypeId !== existing.employeeTypeId || dayOfWeek !== existing.dayOfWeek) {
          const conflict = await this.repo.getByUniqueContext(companyId, employeeTypeId, dayOfWeek);
          if (conflict && conflict.id !== id) {
            throw new Error(
              'A weekly off policy for this employee type and day of week already exists',
            );
          }
        }
      }
    }

    return this.repo.update(id, companyId, data);
  }

  public async deactivate(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.deactivate(id, companyId);
  }

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }
}

export const weeklyOffPolicyService = new WeeklyOffPolicyService();
