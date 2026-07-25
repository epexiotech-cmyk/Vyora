/* eslint-disable no-console */
import { VyoraDatabase } from '../client/db';

import { seedGstStates } from './states';

export const seedDatabase = async (db: VyoraDatabase) => {
  // Always run GST states seed (it handles duplicates)
  await seedGstStates(db);

  console.log('Static database seed completed.');
};
