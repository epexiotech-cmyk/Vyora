import { SalaryComponent } from '@vyora/database';
import {
  CreateSalaryComponentInput,
  SalaryComponentDto,
  SalaryComponentListDto,
  SearchSalaryComponentsOptions,
  UpdateSalaryComponentInput,
} from '@vyora/types';

import { salaryComponentRepository } from '../repositories/SalaryComponentRepository';

export class SalaryComponentService {
  public async search(options: SearchSalaryComponentsOptions): Promise<SalaryComponentListDto> {
    const { items, total } = await salaryComponentRepository.search(options);

    return {
      items: items.map(this.mapToDto),
      total,
      page: options.page,
      pageSize: options.pageSize,
      totalPages: Math.ceil(total / options.pageSize),
    };
  }

  public async getById(id: string): Promise<SalaryComponentDto | null> {
    const item = await salaryComponentRepository.getById(id);
    return item ? this.mapToDto(item) : null;
  }

  public async create(data: CreateSalaryComponentInput): Promise<SalaryComponentDto> {
    // Validate baseComponentId exists in active company if specified
    if (data.calculationBase === 'SpecificComponent' && data.baseComponentId) {
      const baseComponent = await salaryComponentRepository.getById(data.baseComponentId);
      if (!baseComponent) {
        throw new Error('Base component not found or belongs to another company');
      }
    }

    // Ensure unique code
    const existing = await salaryComponentRepository.getByCode(data.code);
    if (existing) {
      throw new Error(`Salary component with code ${data.code} already exists`);
    }

    if (data.isBasic) {
      // We need to fetch all active ones to see if there's any basic component.
      const allActive = await salaryComponentRepository.search({
        isActive: true,
        page: 1,
        pageSize: 100,
      });
      const hasBasic = allActive.items.some((c) => c.isBasic);
      if (hasBasic) {
        throw new Error('Only one active Basic component is allowed per company');
      }
    }

    const item = await salaryComponentRepository.create({
      code: data.code,
      name: data.name,
      category: data.category,
      calculationType: data.calculationType,
      calculationBase: data.calculationBase || null,
      baseComponentId: data.baseComponentId || null,
      defaultAmount: data.defaultAmount ?? 0,
      defaultPercentage: data.defaultPercentage ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      isBasic: data.isBasic ?? false,
      isProrated: data.isProrated ?? true,
    });

    return this.mapToDto(item);
  }

  public async update(id: string, data: UpdateSalaryComponentInput): Promise<SalaryComponentDto> {
    const current = await salaryComponentRepository.getById(id);
    if (!current) throw new Error('Salary component not found');

    if (data.code && data.code !== current.code) {
      const existing = await salaryComponentRepository.getByCode(data.code);
      if (existing) {
        throw new Error(`Salary component with code ${data.code} already exists`);
      }
    }

    if (data.calculationBase === 'SpecificComponent' && data.baseComponentId) {
      if (data.baseComponentId === id) {
        throw new Error('A salary component cannot reference itself as a base');
      }
      const baseComponent = await salaryComponentRepository.getById(data.baseComponentId);
      if (!baseComponent) {
        throw new Error('Base component not found or belongs to another company');
      }
    }

    if (data.isBasic || (data.isActive && current.isBasic)) {
      const allActive = await salaryComponentRepository.search({
        isActive: true,
        page: 1,
        pageSize: 100,
      });
      const hasBasic = allActive.items.some((c) => c.isBasic && c.id !== id);
      if (hasBasic) {
        throw new Error('Only one active Basic component is allowed per company');
      }
    }

    const updated = await salaryComponentRepository.update(id, data);
    return this.mapToDto(updated);
  }

  public async deactivate(id: string): Promise<void> {
    const current = await salaryComponentRepository.getById(id);
    if (!current) throw new Error('Salary component not found');
    await salaryComponentRepository.deactivate(id);
  }

  private mapToDto(item: SalaryComponent): SalaryComponentDto {
    return {
      id: item.id,
      companyId: item.companyId,
      code: item.code,
      name: item.name,
      category: item.category as 'Earning' | 'Deduction',
      calculationType: item.calculationType as 'Fixed' | 'Percentage',
      calculationBase: item.calculationBase,
      baseComponentId: item.baseComponentId,
      defaultAmount: item.defaultAmount,
      defaultPercentage: item.defaultPercentage,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      isBasic: item.isBasic,
      isProrated: item.isProrated,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export const salaryComponentService = new SalaryComponentService();
