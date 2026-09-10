import { SalaryComponentDto } from './salaryComponent.dto';

export interface SalaryStructureLineDto {
  id: string;
  companyId: string;
  structureId: string;
  salaryComponentId: string;
  amount: number;
  percentage: number | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  // Extended info for UI
  component?: SalaryComponentDto;
}

export interface SalaryStructureDto {
  id: string;
  companyId: string;
  employeeId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;

  lines: SalaryStructureLineDto[];
}

export interface CreateSalaryStructureLineInput {
  salaryComponentId: string;
  amount: number;
  percentage?: number | null;
  displayOrder: number;
}

export interface CreateSalaryStructureInput {
  employeeId: string;
  effectiveFrom: Date;
  lines: CreateSalaryStructureLineInput[];
}
