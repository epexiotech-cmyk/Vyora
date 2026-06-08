import { ApiResponse } from '@vyora/types';

import { loggerService } from '../../../services/logger/LoggerService';

import { UqcRepository } from './UqcRepository';

export class UqcService {
  private repository: UqcRepository;

  constructor() {
    this.repository = new UqcRepository();
  }

  async getByCode(code: string): Promise<ApiResponse<unknown>> {
    try {
      if (!code) {
        return { success: false, error: 'UQC code is required' };
      }

      const uqc = await this.repository.findByCode(code.toUpperCase());
      if (!uqc) {
        return { success: false, error: 'UQC not found' };
      }

      return { success: true, data: uqc };
    } catch (e) {
      loggerService.error('[UqcService] Error getting UQC by code:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async search(query: string): Promise<ApiResponse<unknown>> {
    try {
      const results = await this.repository.search(query);
      return { success: true, data: results };
    } catch (e) {
      loggerService.error('[UqcService] Error searching UQC:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const uqcService = new UqcService();
