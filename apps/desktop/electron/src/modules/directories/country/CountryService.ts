import { ApiResponse } from '@vyora/types';

import { loggerService } from '../../../services/logger/LoggerService';

import { CountryRepository } from './CountryRepository';

export class CountryService {
  private repository: CountryRepository;

  constructor() {
    this.repository = new CountryRepository();
  }

  async getByCode(code: string): Promise<ApiResponse<unknown>> {
    try {
      if (!code) {
        return { success: false, error: 'Country code is required' };
      }

      const country = await this.repository.findByCode(code.toUpperCase());
      if (!country) {
        return { success: false, error: 'Country not found' };
      }

      return { success: true, data: country };
    } catch (e) {
      loggerService.error('[CountryService] Error getting country by code:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async search(query: string): Promise<ApiResponse<unknown>> {
    try {
      const results = await this.repository.search(query);
      return { success: true, data: results };
    } catch (e) {
      loggerService.error('[CountryService] Error searching countries:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const countryService = new CountryService();
