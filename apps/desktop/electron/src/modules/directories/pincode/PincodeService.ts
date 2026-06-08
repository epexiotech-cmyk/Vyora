import { PincodeDTO, PincodeSearchResponse, ApiResponse } from '@vyora/types';

import { loggerService } from '../../../services/logger/LoggerService';

import { PincodeRepository } from './PincodeRepository';

export class PincodeService {
  constructor(private repo: PincodeRepository) {}

  async getByPincode(pincode: string): Promise<ApiResponse<PincodeDTO | null>> {
    try {
      const data = await this.repo.findByPincode(pincode);
      if (!data) return { success: true, data: null };
      return { success: true, data: this.mapToDTO(data) };
    } catch (e) {
      loggerService.error('[PincodeService] getByPincode failed', e);
      return { success: false, error: 'Failed to fetch pincode' };
    }
  }

  async search(query: {
    pincode?: string;
    district?: string;
    state?: string;
  }): Promise<ApiResponse<PincodeSearchResponse>> {
    try {
      const results = await this.repo.search(query);
      const data = results.map((record) => this.mapToDTO(record));
      return { success: true, data: { data, total: data.length } };
    } catch (e) {
      loggerService.error('[PincodeService] search failed', e);
      return { success: false, error: 'Failed to search pincodes' };
    }
  }

  private mapToDTO(record: Record<string, unknown>): PincodeDTO {
    return {
      id: record.id as number,
      pincode: record.pincode as string,
      officeName: record.officeName as string | null,
      district: record.district as string | null,
      stateName: record.stateName as string | null,
      regionName: record.regionName as string | null,
      divisionName: record.divisionName as string | null,
      officeType: record.officeType as string | null,
      deliveryStatus: record.deliveryStatus as string | null,
      latitude: record.latitude as number | null,
      longitude: record.longitude as number | null,
      createdAt: record.createdAt as string | null,
    };
  }
}

export const pincodeService = new PincodeService(new PincodeRepository());
