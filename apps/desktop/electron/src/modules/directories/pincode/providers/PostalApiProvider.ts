import type { PincodeDTO, PostalApiResponseDTO, PostalApiPostOfficeDTO } from '@vyora/types';

import { IPincodeProvider } from './IPincodeProvider';

export class PostalApiProvider implements IPincodeProvider {
  private readonly baseUrl = 'https://api.postalpincode.in/pincode/';
  private readonly timeoutMs = 3000;
  private readonly maxRetries = 1;

  async lookup(pincode: string): Promise<PincodeDTO[]> {
    return this.executeWithRetry(pincode, 0);
  }

  private async executeWithRetry(pincode: string, attempt: number): Promise<PincodeDTO[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${pincode}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = (await response.json()) as PostalApiResponseDTO[];
      return this.mapToPincodeDTOs(pincode, data);
    } catch {
      clearTimeout(timeoutId);

      if (attempt < this.maxRetries) {
        return this.executeWithRetry(pincode, attempt + 1);
      }

      // Offline-first: swallow network errors, DNS errors, and timeouts.
      return [];
    }
  }

  private mapToPincodeDTOs(pincode: string, response: PostalApiResponseDTO[]): PincodeDTO[] {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return [];
    }

    const firstResult = response[0];
    if (firstResult.Status !== 'Success' || !firstResult.PostOffice) {
      return [];
    }

    return firstResult.PostOffice.map((office: PostalApiPostOfficeDTO) => ({
      id: 0, // 0 signifies it's not from master/cache yet, or will be assigned on save
      pincode: office.Pincode,
      officeName: office.Name,
      district: office.District,
      stateName: office.State,
      regionName: office.Region,
      divisionName: office.Division,
      officeType: office.BranchType,
      deliveryStatus: office.DeliveryStatus,
      latitude: null,
      longitude: null,
      createdAt: new Date().toISOString(),
    }));
  }
}
