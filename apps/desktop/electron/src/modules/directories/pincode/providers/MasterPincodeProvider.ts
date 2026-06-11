import type { PincodeDTO } from '@vyora/types';

import { PincodeRepository } from '../PincodeRepository';

import { IPincodeProvider } from './IPincodeProvider';

export class MasterPincodeProvider implements IPincodeProvider {
  private repository: PincodeRepository;

  constructor(repository: PincodeRepository) {
    this.repository = repository;
  }

  async lookup(pincode: string): Promise<PincodeDTO[]> {
    try {
      const records = await this.repository.findByPincode(pincode);
      if (!records || records.length === 0) {
        return [];
      }
      return records as PincodeDTO[];
    } catch {
      // Offline-first: Never throw exceptions to the upper layers.
      // Log error if logger was available here, then return empty array.
      return [];
    }
  }
}
