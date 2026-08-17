import { VyoraDatabase } from '@vyora/database';
import { sql } from 'drizzle-orm';

export interface IMigrationCheck {
  readonly name: string;
  execute(db: VyoraDatabase): void | Promise<void>;
}

export class VoucherReferenceUniquenessCheck implements IMigrationCheck {
  public readonly name = 'VoucherReferenceUniquenessCheck';

  public execute(db: VyoraDatabase): void {
    try {
      const duplicates = db.all(
        sql`
          SELECT company_id, reference_type, reference_id, COUNT(*)
          FROM vouchers
          WHERE is_cancelled = 0
          GROUP BY company_id, reference_type, reference_id
          HAVING COUNT(*) > 1;
        `,
      );

      if (duplicates.length > 0) {
        throw new Error(
          'Migration aborted: Multiple active vouchers already exist for the same reference. Please resolve duplicates before migrating.',
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('no such table')) {
        return; // Safe to ignore on fresh installs where vouchers table doesn't exist yet
      }
      throw err;
    }
  }
}
