import { ApiResponse } from '@vyora/types';

import { loggerService } from '../../../services/logger/LoggerService';

import { CurrencyRepository } from './CurrencyRepository';

export class CurrencyService {
  private repository: CurrencyRepository;

  constructor() {
    this.repository = new CurrencyRepository();
  }

  async getByCode(code: string): Promise<ApiResponse<unknown>> {
    try {
      if (!code) {
        return { success: false, error: 'Currency code is required' };
      }

      const currency = await this.repository.findByCode(code.toUpperCase());
      if (!currency) {
        return { success: false, error: 'Currency not found' };
      }

      return { success: true, data: currency };
    } catch (e) {
      loggerService.error('[CurrencyService] Error getting currency by code:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async search(query: string): Promise<ApiResponse<unknown>> {
    try {
      const results = await this.repository.search(query);
      return { success: true, data: results };
    } catch (e) {
      loggerService.error('[CurrencyService] Error searching currencies:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const currencyService = new CurrencyService();
