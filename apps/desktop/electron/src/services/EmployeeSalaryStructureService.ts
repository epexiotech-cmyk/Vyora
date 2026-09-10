import {
  CreateSalaryStructureInput,
  SalaryStructureDto,
  SalaryStructureLineDto,
} from '@vyora/types';

import {
  employeeSalaryStructureRepository,
  PopulatedSalaryStructure,
} from '../repositories/EmployeeSalaryStructureRepository';
import { salaryComponentRepository } from '../repositories/SalaryComponentRepository';

export class EmployeeSalaryStructureService {
  public async getByEmployeeId(employeeId: string): Promise<SalaryStructureDto[]> {
    const structures = await employeeSalaryStructureRepository.getByEmployeeId(employeeId);
    return structures.map(this.mapToDto);
  }

  public async getById(id: string): Promise<SalaryStructureDto | null> {
    const structure = await employeeSalaryStructureRepository.getById(id);
    return structure ? this.mapToDto(structure) : null;
  }

  public async create(data: CreateSalaryStructureInput): Promise<SalaryStructureDto> {
    // Validate effectiveFrom date
    const effectiveFrom = new Date(data.effectiveFrom);
    if (isNaN(effectiveFrom.getTime())) {
      throw new Error('Invalid effectiveFrom date');
    }

    // Verify all components exist and are active in the current company
    const componentIds = new Set(data.lines.map((l) => l.salaryComponentId));
    if (componentIds.size !== data.lines.length) {
      throw new Error('Duplicate salary components in structure lines');
    }

    for (const compId of componentIds) {
      const comp = await salaryComponentRepository.getById(compId);
      if (!comp) {
        throw new Error(`Salary component ${compId} not found or belongs to another company`);
      }
      if (!comp.isActive) {
        throw new Error(`Salary component ${compId} is inactive and cannot be assigned`);
      }
    }

    const structure = await employeeSalaryStructureRepository.create(
      {
        employeeId: data.employeeId,
        effectiveFrom,
      },
      data.lines.map((l) => ({
        salaryComponentId: l.salaryComponentId,
        amount: Math.round(l.amount), // ensure integer paise
        percentage: l.percentage ?? null,
        displayOrder: l.displayOrder,
      })),
    );

    return this.mapToDto(structure);
  }

  private mapToDto(item: PopulatedSalaryStructure): SalaryStructureDto {
    return {
      id: item.id,
      companyId: item.companyId,
      employeeId: item.employeeId,
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo,
      isActive: item.isActive,
      syncVersion: item.syncVersion,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      lines: item.lines.map(
        (line): SalaryStructureLineDto => ({
          id: line.id,
          companyId: line.companyId,
          structureId: line.structureId,
          salaryComponentId: line.salaryComponentId,
          amount: line.amount,
          percentage: line.percentage,
          displayOrder: line.displayOrder,
          createdAt: line.createdAt,
          updatedAt: line.updatedAt,
        }),
      ),
    };
  }
}

export const employeeSalaryStructureService = new EmployeeSalaryStructureService();
