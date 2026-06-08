import { ApiResponse } from '@vyora/types';

import { loggerService } from '../../../services/logger/LoggerService';

import { StateRepository } from './StateRepository';

export class StateService {
  private repository: StateRepository;

  constructor() {
    this.repository = new StateRepository();
  }

  async getByCode(code: string): Promise<ApiResponse<unknown>> {
    try {
      if (!code) {
        return { success: false, error: 'State code is required' };
      }

      const state = await this.repository.findByCode(code.toUpperCase());
      if (!state) {
        return { success: false, error: 'State not found' };
      }

      return { success: true, data: state };
    } catch (e) {
      loggerService.error('[StateService] Error getting state by code:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  async search(query: string): Promise<ApiResponse<unknown>> {
    try {
      const results = await this.repository.search(query);
      return { success: true, data: results };
    } catch (e) {
      loggerService.error('[StateService] Error searching states:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const stateService = new StateService();
