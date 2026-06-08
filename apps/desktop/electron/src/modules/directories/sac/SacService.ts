import { ApiResponse } from '@vyora/types';

import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';
import { loggerService } from '../../../services/logger/LoggerService';

import { SacDto } from './SacDto';
import { SacRepository } from './SacRepository';

export class SacService {
  private repository: SacRepository;

  constructor() {
    this.repository = new SacRepository(directoryDatabaseService);
  }

  public async getByCode(sacCode: string): Promise<ApiResponse<SacDto | null>> {
    try {
      const data = await this.repository.getByCode(sacCode);
      return { success: true, data };
    } catch (error) {
      loggerService.error('Failed to get SAC code', { sacCode, error });
      return { success: false, error: 'Failed to retrieve SAC code' };
    }
  }

  public async search(query: string, includeAll: boolean = false): Promise<ApiResponse<SacDto[]>> {
    try {
      const data = await this.repository.search(query, 50, includeAll);
      return { success: true, data };
    } catch (error) {
      loggerService.error('Failed to search SAC codes', { query, error });
      return { success: false, error: 'Failed to search SAC codes' };
    }
  }
}

export const sacService = new SacService();
