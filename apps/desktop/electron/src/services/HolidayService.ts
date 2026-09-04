import {
  CreateHolidayInput,
  UpdateHolidayInput,
  HolidayDto,
  SearchHolidaysOptions,
  HolidayListDto,
} from '@vyora/types';

import { HolidayRepository } from '../repositories/HolidayRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';

class HolidayService {
  private repo = new HolidayRepository();

  public async search(options: SearchHolidaysOptions): Promise<HolidayListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.search(companyId, options);
  }

  public async getAll(): Promise<HolidayDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getAll(companyId);
  }

  public async getById(id: string): Promise<HolidayDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getById(id, companyId);
  }

  public async create(data: CreateHolidayInput): Promise<HolidayDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const existing = await this.repo.getByDate(companyId, data.date);
    if (existing) {
      throw new Error('A holiday with this date already exists for this company');
    }

    return this.repo.create(companyId, data);
  }

  public async update(id: string, data: UpdateHolidayInput): Promise<HolidayDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    if (data.date) {
      const existing = await this.repo.getByDate(companyId, data.date);
      if (existing && existing.id !== id) {
        throw new Error('A holiday with this date already exists for this company');
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

export const holidayService = new HolidayService();
