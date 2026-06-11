import type { PincodeDTO } from '@vyora/types';

export interface IPincodeProvider {
  /**
   * Looks up a pincode and returns an array of associated Post Offices.
   * Resolves with an empty array if not found or if a graceful failure occurs.
   */
  lookup(pincode: string): Promise<PincodeDTO[]>;
}
