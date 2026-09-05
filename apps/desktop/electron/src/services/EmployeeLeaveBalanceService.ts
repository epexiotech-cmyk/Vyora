import {
  EmployeeLeaveBalanceDto,
  CreateEmployeeLeaveBalanceInput,
  UpdateEmployeeLeaveBalanceInput,
  SearchEmployeeLeaveBalancesOptions,
  EmployeeLeaveBalanceListDto,
} from '@vyora/types';

import { EmployeeLeaveBalanceRepository } from '../repositories/EmployeeLeaveBalanceRepository';
import { FinancialYearRepository } from '../repositories/FinancialYearRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';
import { leaveTypeService } from './LeaveTypeService';

class EmployeeLeaveBalanceService {
  private repo = new EmployeeLeaveBalanceRepository();
  private fyRepo = new FinancialYearRepository();

  public async search(
    options: SearchEmployeeLeaveBalancesOptions,
  ): Promise<EmployeeLeaveBalanceListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.search(companyId, options);
  }

  public async getById(id: string): Promise<EmployeeLeaveBalanceDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    const item = await this.repo.getById(id, companyId);
    if (!item) {
      throw new Error('Employee leave balance not found');
    }
    return item;
  }

  public async create(data: CreateEmployeeLeaveBalanceInput): Promise<EmployeeLeaveBalanceDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const [emp, lt, fy] = await Promise.all([
      employeeService.getById(data.employeeId),
      leaveTypeService.getById(data.leaveTypeId),
      this.fyRepo.getById(data.financialYearId),
    ]);

    if (!emp || emp.companyId !== companyId)
      throw new Error('Invalid employee or belongs to another company');
    if (!lt) throw new Error('Invalid leave type or belongs to another company');
    if (!fy || fy.companyId !== companyId)
      throw new Error('Invalid financial year or belongs to another company');

    const existing = await this.repo.getByUniqueContext(
      companyId,
      data.employeeId,
      data.leaveTypeId,
      data.financialYearId,
    );
    if (existing) {
      throw new Error(
        'A leave balance for this employee, leave type, and financial year already exists',
      );
    }

    return this.repo.create(companyId, data);
  }

  public async update(
    id: string,
    data: UpdateEmployeeLeaveBalanceInput,
  ): Promise<EmployeeLeaveBalanceDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    if (data.employeeId || data.leaveTypeId || data.financialYearId) {
      const existing = await this.repo.getById(id, companyId);
      if (existing) {
        const employeeId = data.employeeId || existing.employeeId;
        const leaveTypeId = data.leaveTypeId || existing.leaveTypeId;
        const financialYearId = data.financialYearId || existing.financialYearId;

        if (data.employeeId) {
          const emp = await employeeService.getById(data.employeeId);
          if (!emp || emp.companyId !== companyId)
            throw new Error('Invalid employee or belongs to another company');
        }
        if (data.leaveTypeId) {
          const lt = await leaveTypeService.getById(data.leaveTypeId);
          if (!lt) throw new Error('Invalid leave type or belongs to another company');
        }
        if (data.financialYearId) {
          const fy = await this.fyRepo.getById(data.financialYearId);
          if (!fy || fy.companyId !== companyId)
            throw new Error('Invalid financial year or belongs to another company');
        }

        if (
          employeeId !== existing.employeeId ||
          leaveTypeId !== existing.leaveTypeId ||
          financialYearId !== existing.financialYearId
        ) {
          const conflict = await this.repo.getByUniqueContext(
            companyId,
            employeeId,
            leaveTypeId,
            financialYearId,
          );
          if (conflict && conflict.id !== id) {
            throw new Error(
              'A leave balance for this employee, leave type, and financial year already exists',
            );
          }
        }
      }
    }

    return this.repo.update(id, companyId, data);
  }

  public async delete(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();
    return this.repo.delete(id, companyId);
  }

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }
}

export const employeeLeaveBalanceService = new EmployeeLeaveBalanceService();
