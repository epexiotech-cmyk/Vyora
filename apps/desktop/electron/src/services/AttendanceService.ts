import {
  AttendanceListDto,
  AttendanceRecordDto,
  ClearAttendanceInput,
  MarkAttendanceInput,
  SearchAttendanceOptions,
  attendanceRecordDtoSchema,
  clearAttendanceInputSchema,
  markAttendanceInputSchema,
  searchAttendanceOptionsSchema,
} from '@vyora/types';

import { attendanceRepository } from '../repositories/AttendanceRepository';

import { companyContextService } from './CompanyContextService';
import { employeeService } from './EmployeeService';

export class AttendanceService {
  private requireCompany(): string {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');
    return companyId;
  }

  private mapToDto(record: import('@vyora/database').AttendanceRecord): AttendanceRecordDto {
    return attendanceRecordDtoSchema.parse({
      ...record,
      attendanceDate: new Date(record.attendanceDate),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }

  async getById(id: string): Promise<AttendanceRecordDto | null> {
    const companyId = this.requireCompany();
    const record = await attendanceRepository.getById(id, companyId);
    if (!record) return null;
    return this.mapToDto(record);
  }

  async search(options: SearchAttendanceOptions): Promise<AttendanceListDto> {
    const companyId = this.requireCompany();
    const validatedOptions = searchAttendanceOptionsSchema.parse(options);

    const { data, total } = await attendanceRepository.search(companyId, validatedOptions);

    return {
      items: data.map((item) => this.mapToDto(item)),
      total,
    };
  }

  async mark(input: MarkAttendanceInput): Promise<AttendanceRecordDto> {
    const companyId = this.requireCompany();
    const validatedData = markAttendanceInputSchema.parse(input);

    // Validate employee ownership
    const employee = await employeeService.getById(validatedData.employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new Error('Employee not found or belongs to another company');
    }

    // Ensure date has no time component to prevent multiple records for the same day due to time mismatch
    const normalizedDate = new Date(validatedData.attendanceDate);
    normalizedDate.setHours(0, 0, 0, 0);

    const record = await attendanceRepository.mark(companyId, {
      ...validatedData,
      attendanceDate: normalizedDate,
    });

    return this.mapToDto(record);
  }

  async clear(input: ClearAttendanceInput): Promise<void> {
    const companyId = this.requireCompany();
    const validatedData = clearAttendanceInputSchema.parse(input);

    // Validate employee ownership
    const employee = await employeeService.getById(validatedData.employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new Error('Employee not found or belongs to another company');
    }

    const normalizedDate = new Date(validatedData.attendanceDate);
    normalizedDate.setHours(0, 0, 0, 0);

    await attendanceRepository.clear(companyId, validatedData.employeeId, normalizedDate);
  }
}

export const attendanceService = new AttendanceService();
