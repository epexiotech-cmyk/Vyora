import {
  CreateLeaveRequestInput,
  LeaveRequestDto,
  LeaveRequestListDto,
  SearchLeaveRequestsOptions,
  UpdateLeaveRequestInput,
  createLeaveRequestInputSchema,
  updateLeaveRequestInputSchema,
  searchLeaveRequestsOptionsSchema,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
  CancelLeaveRequestInput,
} from '@vyora/types';

import { EmployeeLeaveBalanceRepository } from '../repositories/EmployeeLeaveBalanceRepository';
import { FinancialYearRepository } from '../repositories/FinancialYearRepository';
import { leaveRequestRepository } from '../repositories/LeaveRequestRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { dbService } from './database/DatabaseService';
import { employeeService } from './EmployeeService';
import { leaveCalculationService } from './LeaveCalculationService';
import { leaveTypeService } from './LeaveTypeService';

export class LeaveRequestService {
  private fyRepo = new FinancialYearRepository();
  private balanceRepo = new EmployeeLeaveBalanceRepository();

  private requireCompany(): string {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');
    return companyId;
  }

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }

  private mapToDto(record: import('@vyora/database').LeaveRequest): LeaveRequestDto {
    return {
      ...record,
      fromDate: new Date(record.fromDate),
      toDate: new Date(record.toDate),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
      approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
    };
  }

  async search(options: SearchLeaveRequestsOptions): Promise<LeaveRequestListDto> {
    const companyId = this.requireCompany();
    const validatedOptions = searchLeaveRequestsOptionsSchema.parse(options);

    const { data, total } = await leaveRequestRepository.search(companyId, {
      ...validatedOptions,
      page: validatedOptions.page || 1,
      limit: validatedOptions.limit || 50,
    });

    const page = validatedOptions.page || 1;
    const limit = validatedOptions.limit || 50;

    return {
      items: data.map((item) => this.mapToDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<LeaveRequestDto | null> {
    const companyId = this.requireCompany();
    const record = await leaveRequestRepository.getById(id, companyId);
    if (!record) return null;
    return this.mapToDto(record);
  }

  async create(input: CreateLeaveRequestInput): Promise<LeaveRequestDto> {
    const companyId = this.requireCompany();
    const validatedData = createLeaveRequestInputSchema.parse(input);

    let createdRecord: import('@vyora/database').LeaveRequest | undefined;

    await dbService.getDb().transaction(async (tx) => {
      // Validate relations
      const employee = await employeeService.getById(validatedData.employeeId);
      if (!employee || employee.companyId !== companyId) {
        throw new Error('Employee not found in the active company');
      }

      const leaveType = await leaveTypeService.getById(validatedData.leaveTypeId);
      if (!leaveType || leaveType.companyId !== companyId) {
        throw new Error('Leave type not found in the active company');
      }

      const financialYear = await this.fyRepo.getByIdSync(validatedData.financialYearId, tx);
      if (!financialYear || financialYear.companyId !== companyId) {
        throw new Error('Financial year not found in the active company');
      }

      // Overlap validation
      const overlappingRequests = await leaveRequestRepository.findOverlappingRequests(
        companyId,
        validatedData.employeeId,
        validatedData.fromDate,
        validatedData.toDate,
      );

      if (overlappingRequests.length > 0) {
        throw new Error('A leave request already exists for the overlapping date range.');
      }

      // Calculate authoritative days
      const calculation = await leaveCalculationService.calculateEffectiveDays({
        employeeId: validatedData.employeeId,
        leaveTypeId: validatedData.leaveTypeId,
        fromDate: validatedData.fromDate,
        toDate: validatedData.toDate,
        requestedDays: validatedData.requestedDays,
      });

      if (calculation.requestedDays > calculation.effectiveFullDays) {
        throw new Error(
          `Requested days (${calculation.requestedDays}) exceed effective full days (${calculation.effectiveFullDays})`,
        );
      }

      // Verify balance row exists
      const balance = await this.balanceRepo.getByUniqueContext(
        companyId,
        validatedData.employeeId,
        validatedData.leaveTypeId,
        validatedData.financialYearId,
      );

      if (!balance) {
        throw new Error('Leave balance configuration missing for this employee and leave type.');
      }

      // Atomically increment pending
      await this.balanceRepo.incrementBalance(
        balance.id,
        companyId,
        { pendingDelta: calculation.requestedDays, usedDelta: 0 },
        tx,
      );

      // Create request
      createdRecord = await leaveRequestRepository.create({
        companyId,
        ...validatedData,
      });
    });

    return this.mapToDto(createdRecord!);
  }

  async update(id: string, input: UpdateLeaveRequestInput): Promise<LeaveRequestDto> {
    const companyId = this.requireCompany();
    const validatedData = updateLeaveRequestInputSchema.parse(input);

    // Hardened generic update: only allow safe metadata updates (e.g., reason).
    // We disallow changing requestedDays, fromDate, toDate here because it requires atomic balance reconciliation.
    const safeData: Partial<UpdateLeaveRequestInput> = {};
    if (validatedData.reason !== undefined) {
      safeData.reason = validatedData.reason;
    }
    if (Object.keys(safeData).length === 0) {
      throw new Error('Only the reason field can be updated directly via this method.');
    }

    const existing = await leaveRequestRepository.getById(id, companyId);
    if (!existing) throw new Error('Leave request not found');

    if (existing.status !== 'Pending') {
      throw new Error('Only Pending leave requests can be updated directly');
    }

    const record = await leaveRequestRepository.update(id, companyId, safeData);
    return this.mapToDto(record);
  }

  async delete(_id: string): Promise<void> {
    // Delete is essentially a Cancel for Pending requests, but softDelete currently does not revert balances.
    // So we reject it here and require explicit cancellation.
    throw new Error('Please use the cancel() method to cancel a leave request.');
  }

  async approve(id: string, input: ApproveLeaveRequestInput): Promise<void> {
    const companyId = this.requireCompany();
    this.checkAdminRole();

    await dbService.getDb().transaction(async (tx) => {
      const existing = await leaveRequestRepository.getById(id, companyId);
      if (!existing) throw new Error('Leave request not found');
      if (existing.status !== 'Pending') throw new Error('Only Pending requests can be approved');

      if (input.approverId) {
        const approver = await employeeService.getById(input.approverId);
        if (!approver || approver.companyId !== companyId) {
          throw new Error('Approver not found or belongs to another company');
        }
      }

      const calculation = await leaveCalculationService.calculateEffectiveDays({
        employeeId: existing.employeeId,
        leaveTypeId: existing.leaveTypeId,
        fromDate: new Date(existing.fromDate),
        toDate: new Date(existing.toDate),
        requestedDays: existing.requestedDays,
      });

      if (calculation.requestedDays > calculation.effectiveFullDays) {
        throw new Error(
          `Requested days (${calculation.requestedDays}) exceed effective full days (${calculation.effectiveFullDays})`,
        );
      }

      const balance = await this.balanceRepo.getByUniqueContext(
        companyId,
        existing.employeeId,
        existing.leaveTypeId,
        existing.financialYearId,
      );

      if (!balance)
        throw new Error('Leave balance configuration missing for this employee and leave type.');

      // Atomically shift pending to used
      await this.balanceRepo.incrementBalance(
        balance.id,
        companyId,
        { pendingDelta: -existing.requestedDays, usedDelta: existing.requestedDays },
        tx,
      );

      // Atomically transition status
      await leaveRequestRepository.transitionStatus(
        id,
        companyId,
        'Pending',
        'Approved',
        {
          approverId: input.approverId || null,
          approverRemarks: input.approverRemarks || null,
          approvedAt: new Date(),
        },
        tx,
      );
    });
  }

  async reject(id: string, input: RejectLeaveRequestInput): Promise<void> {
    const companyId = this.requireCompany();
    this.checkAdminRole();

    await dbService.getDb().transaction(async (tx) => {
      const existing = await leaveRequestRepository.getById(id, companyId);
      if (!existing) throw new Error('Leave request not found');
      if (existing.status !== 'Pending') throw new Error('Only Pending requests can be rejected');

      if (input.approverId) {
        const approver = await employeeService.getById(input.approverId);
        if (!approver || approver.companyId !== companyId) {
          throw new Error('Approver not found or belongs to another company');
        }
      }

      const balance = await this.balanceRepo.getByUniqueContext(
        companyId,
        existing.employeeId,
        existing.leaveTypeId,
        existing.financialYearId,
      );

      if (!balance) throw new Error('Leave balance configuration missing.');

      // Refund pending balance
      await this.balanceRepo.incrementBalance(
        balance.id,
        companyId,
        { pendingDelta: -existing.requestedDays, usedDelta: 0 },
        tx,
      );

      // Atomically transition status
      await leaveRequestRepository.transitionStatus(
        id,
        companyId,
        'Pending',
        'Rejected',
        {
          approverId: input.approverId || null,
          approverRemarks: input.approverRemarks || null,
          approvedAt: null,
        },
        tx,
      );
    });
  }

  async cancel(id: string, input: CancelLeaveRequestInput): Promise<void> {
    const companyId = this.requireCompany();
    this.checkAdminRole();

    await dbService.getDb().transaction(async (tx) => {
      const existing = await leaveRequestRepository.getById(id, companyId);
      if (!existing) throw new Error('Leave request not found');
      if (existing.status !== 'Pending' && existing.status !== 'Approved') {
        throw new Error('Only Pending or Approved requests can be cancelled');
      }

      const balance = await this.balanceRepo.getByUniqueContext(
        companyId,
        existing.employeeId,
        existing.leaveTypeId,
        existing.financialYearId,
      );

      if (!balance) throw new Error('Leave balance configuration missing.');

      if (existing.status === 'Pending') {
        // Refund pending
        await this.balanceRepo.incrementBalance(
          balance.id,
          companyId,
          { pendingDelta: -existing.requestedDays, usedDelta: 0 },
          tx,
        );
      } else if (existing.status === 'Approved') {
        // Refund used
        await this.balanceRepo.incrementBalance(
          balance.id,
          companyId,
          { pendingDelta: 0, usedDelta: -existing.requestedDays },
          tx,
        );
      }

      // Atomically transition status
      await leaveRequestRepository.transitionStatus(
        id,
        companyId,
        existing.status,
        'Cancelled',
        {
          approverRemarks: input.remarks || null,
        },
        tx,
      );
    });
  }
}

export const leaveRequestService = new LeaveRequestService();
