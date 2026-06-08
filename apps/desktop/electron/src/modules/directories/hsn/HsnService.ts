import { HsnRepository } from './HsnRepository';
import { HsnDto } from './HsnDto';
import { BaseResponse } from '@vyora/database';
import { directoryDatabaseService } from '../../../services/database/DirectoryDatabaseService';

export class HsnService {
  constructor(private readonly repository: HsnRepository) {}

  public async getByCode(hsnCode: string): Promise<BaseResponse<HsnDto>> {
    try {
      const hsn = await this.repository.getByCode(hsnCode);
      if (!hsn) {
        return { success: false, error: 'HSN code not found' };
      }
      return { success: true, data: hsn };
    } catch (error) {
      console.error('Failed to get HSN code:', error);
      return { success: false, error: 'Failed to retrieve HSN code' };
    }
  }

  public async search(query: string, limit?: number): Promise<BaseResponse<HsnDto[]>> {
    try {
      const results = await this.repository.search(query, limit);
      return { success: true, data: results };
    } catch (error) {
      console.error('Failed to search HSN codes:', error);
      return { success: false, error: 'Failed to search HSN codes' };
    }
  }
}

export const hsnRepository = new HsnRepository(directoryDatabaseService);
export const hsnService = new HsnService(hsnRepository);
