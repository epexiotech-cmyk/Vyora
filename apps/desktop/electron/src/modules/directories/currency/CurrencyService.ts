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

      const currency = await this.repository.findByCodeAllStatuses(code.toUpperCase());
      if (!currency) {
        return { success: false, error: `Currency "${code.toUpperCase()}" not found` };
      }

      if (!currency.isActive) {
        return { success: false, error: `Currency "${code.toUpperCase()}" is inactive` };
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

  async getActive(): Promise<ApiResponse<unknown[]>> {
    try {
      const results = await this.repository.getActive();
      return { success: true, data: results };
    } catch (e) {
      loggerService.error('[CurrencyService] Error getting active currencies:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async getPrimary(): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.repository.getPrimary();
      return { success: true, data: result };
    } catch (e) {
      loggerService.error('[CurrencyService] Error getting primary currency:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async validatePrimaryCurrencyAssignment(code: string): Promise<ApiResponse<void>> {
    try {
      const existingPrimary = await this.repository.getPrimary();

      if (existingPrimary && existingPrimary.currencyCode !== code) {
        return {
          success: false,
          error: `Currency ${existingPrimary.currencyName} is already set as Primary. Only one Primary currency is allowed.`,
        };
      }

      return { success: true };
    } catch (e) {
      loggerService.error('[CurrencyService] Error validating primary currency assignment:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const currencyService = new CurrencyService();
