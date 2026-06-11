import { pincodeDynamicCache } from '@vyora/database';
import type { PincodeDTO, SmartPincodeLookupResponse } from '@vyora/types';

import { PincodeDynamicCacheRepository } from './PincodeDynamicCacheRepository';
import { PincodeRepository } from './PincodeRepository';
import { IPincodeProvider } from './providers/IPincodeProvider';
import { MasterPincodeProvider } from './providers/MasterPincodeProvider';
import { PostalApiProvider } from './providers/PostalApiProvider';

export class SmartPincodeLookupService {
  private cacheRepository: PincodeDynamicCacheRepository;
  private masterProvider: IPincodeProvider;
  private apiProvider: IPincodeProvider;

  constructor(
    cacheRepository: PincodeDynamicCacheRepository,
    masterProvider: IPincodeProvider,
    apiProvider: IPincodeProvider,
  ) {
    this.cacheRepository = cacheRepository;
    this.masterProvider = masterProvider;
    this.apiProvider = apiProvider;
  }

  async lookup(pincode: string): Promise<SmartPincodeLookupResponse> {
    try {
      // 1. Check Dynamic Cache
      const cached = await this.cacheRepository.findByPincode(pincode);
      if (cached && cached.length > 0) {
        // Run stats increment asynchronously so it doesn't block the UI return
        this.cacheRepository.incrementLookupStats(pincode).catch(() => {});

        return {
          pincode,
          offices: cached as unknown as PincodeDTO[],
          source: 'CACHE',
        };
      }

      // 2. Check Master Database
      const masterResults = await this.masterProvider.lookup(pincode);
      if (masterResults && masterResults.length > 0) {
        return {
          pincode,
          offices: masterResults,
          source: 'MASTER',
        };
      }

      // 3. Fallback to API
      const apiResults = await this.apiProvider.lookup(pincode);
      if (apiResults && apiResults.length > 0) {
        // Transform and save to cache
        const cacheEntries = apiResults.map((office) => ({
          pincode: office.pincode,
          officeName: office.officeName,
          district: office.district,
          stateName: office.stateName,
          regionName: office.regionName,
          divisionName: office.divisionName,
          source: 'API',
          lookupCount: 1,
          lastVerifiedAt: new Date().toISOString(),
        }));

        const saved = await this.cacheRepository.saveMany(
          cacheEntries as Omit<typeof pincodeDynamicCache.$inferInsert, 'id'>[],
        );

        return {
          pincode,
          offices: saved as unknown as PincodeDTO[],
          source: 'API',
        };
      }

      // 4. Not Found anywhere
      return {
        pincode,
        offices: [],
        source: 'NOT_FOUND',
      };
    } catch (error) {
      // Complete offline-first shielding: no unhandled exceptions leak to UI.
      return {
        pincode,
        offices: [],
        source: 'NOT_FOUND',
        error: error instanceof Error ? error.message : 'Unknown lookup error',
      };
    }
  }
}

export const smartPincodeLookupService = new SmartPincodeLookupService(
  new PincodeDynamicCacheRepository(),
  new MasterPincodeProvider(new PincodeRepository()),
  new PostalApiProvider(),
);
