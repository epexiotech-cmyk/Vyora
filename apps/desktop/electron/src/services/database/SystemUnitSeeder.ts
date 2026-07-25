import { randomUUID } from 'crypto';

import { units, InsertUnit } from '@vyora/database';
import { GST_UQC_MASTER } from '@vyora/utils';

import { DbTransaction } from '../../repositories/BaseRepository';

export class SystemUnitSeeder {
  public seedSystemUnits(companyId: string, tx: DbTransaction): void {
    const now = new Date();

    for (const category of GST_UQC_MASTER) {
      for (const unit of category.units) {
        const id = randomUUID();
        const insertData: InsertUnit = {
          id,
          companyId,
          name: unit.name,
          shortName: unit.shortName,
          uqcCode: `${unit.uqcCode}-${unit.uqcDescription}`,
          isActive: true,
          syncVersion: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        tx.insert(units)
          .values(insertData)
          .onConflictDoNothing({ target: [units.companyId, units.name] })
          .run();
      }
    }
  }
}

export const systemUnitSeeder = new SystemUnitSeeder();
