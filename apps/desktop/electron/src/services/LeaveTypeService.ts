import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  LeaveTypeDto,
  SearchLeaveTypesOptions,
  LeaveTypeListDto,
} from '@vyora/types';

import { LeaveTypeRepository } from '../repositories/LeaveTypeRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class LeaveTypeService {
  private repo = new LeaveTypeRepository();

  public async search(options: SearchLeaveTypesOptions): Promise<LeaveTypeListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.search(companyId, options);
  }

  public async getAll(): Promise<LeaveTypeDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<LeaveTypeDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateLeaveTypeInput): Promise<LeaveTypeDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const existing = await this.repo.getByName(companyId, data.name);
    if (existing) {
      throw new Error('Leave type name already exists for this company');
    }

    return this.repo.create(companyId, data);
  }

  public async update(id: string, data: UpdateLeaveTypeInput): Promise<LeaveTypeDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    if (data.name) {
      const existing = await this.repo.getByName(companyId, data.name);
      if (existing && existing.id !== id) {
        throw new Error('Leave type name already exists for this company');
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

export const leaveTypeService = new LeaveTypeService();
