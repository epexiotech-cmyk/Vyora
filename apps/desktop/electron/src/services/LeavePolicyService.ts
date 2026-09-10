import {
  LeavePolicyDto,
  CreateLeavePolicyInput,
  UpdateLeavePolicyInput,
  SearchLeavePoliciesOptions,
  LeavePolicyListDto,
} from '@vyora/types';

import { FinancialYearRepository } from '../repositories/FinancialYearRepository';
import { LeavePolicyRepository } from '../repositories/LeavePolicyRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { employeeTypeService } from './EmployeeTypeService';
import { leaveTypeService } from './LeaveTypeService';

class LeavePolicyService {
  private repo = new LeavePolicyRepository();
  private fyRepo = new FinancialYearRepository();

  public async search(options: SearchLeavePoliciesOptions): Promise<LeavePolicyListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.search(companyId, options);
  }

  public async getAll(): Promise<LeavePolicyDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<LeavePolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    const item = await this.repo.getById(id, companyId);
    if (!item) {
      throw new Error('LeavePolicy not found');
    }
    return item;
  }

  public async create(data: CreateLeavePolicyInput): Promise<LeavePolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const [et, lt, fy] = await Promise.all([
      employeeTypeService.getById(data.employeeTypeId),
      leaveTypeService.getById(data.leaveTypeId),
      this.fyRepo.getById(data.financialYearId),
    ]);

    if (!et) throw new Error('Invalid employee type or belongs to another company');
    if (!lt) throw new Error('Invalid leave type or belongs to another company');
    if (!fy || fy.companyId !== companyId)
      throw new Error('Invalid financial year or belongs to another company');

    const existing = await this.repo.getByUniqueContext(
      companyId,
      data.leaveTypeId,
      data.employeeTypeId,
      data.financialYearId,
    );
    if (existing) {
      throw new Error(
        'A leave policy for this employee type, leave type, and financial year already exists',
      );
    }

    return this.repo.create(companyId, data);
  }

  public async update(id: string, data: UpdateLeavePolicyInput): Promise<LeavePolicyDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    if (data.leaveTypeId || data.employeeTypeId || data.financialYearId) {
      const existing = await this.repo.getById(id, companyId);
      if (existing) {
        const leaveTypeId = data.leaveTypeId || existing.leaveTypeId;
        const employeeTypeId = data.employeeTypeId || existing.employeeTypeId;
        const financialYearId = data.financialYearId || existing.financialYearId;

        // Perform cross-company validation for provided fields
        if (data.employeeTypeId) {
          const et = await employeeTypeService.getById(data.employeeTypeId);
          if (!et) throw new Error('Invalid employee type or belongs to another company');
        }
        if (data.leaveTypeId) {
          const lt = await leaveTypeService.getById(data.leaveTypeId);
          if (!lt) throw new Error('Invalid leave type or belongs to another company');
        }
        if (data.financialYearId) {
          const fy = await this.fyRepo.getById(data.financialYearId);
          if (!fy || fy.companyId !== companyId) {
            throw new Error('Invalid financial year or belongs to another company');
          }
        }

        if (
          leaveTypeId !== existing.leaveTypeId ||
          employeeTypeId !== existing.employeeTypeId ||
          financialYearId !== existing.financialYearId
        ) {
          const conflict = await this.repo.getByUniqueContext(
            companyId,
            leaveTypeId,
            employeeTypeId,
            financialYearId,
          );
          if (conflict && conflict.id !== id) {
            throw new Error(
              'A leave policy for this employee type, leave type, and financial year already exists',
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

export const leavePolicyService = new LeavePolicyService();
