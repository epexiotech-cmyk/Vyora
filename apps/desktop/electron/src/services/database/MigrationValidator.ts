import { VyoraDatabase } from '@vyora/database';

import { loggerService } from '../logger/LoggerService';

import {
  IMigrationCheck,
  VoucherReferenceUniquenessCheck,
} from './migrations/VoucherReferenceUniquenessCheck';

export class MigrationValidator {
  private checks: IMigrationCheck[] = [];

  constructor() {
    this.registerChecks();
  }

  private registerChecks(): void {
    // Register all pre-migration checks here
    this.checks.push(new VoucherReferenceUniquenessCheck());
  }

  /**
   * Executes all registered validation checks sequentially.
   * This orchestrates checks without owning domain-specific logic.
   */
  public async validatePreMigrations(db: VyoraDatabase): Promise<void> {
    if (this.checks.length === 0) return;

    loggerService.info(
      `[MigrationValidator] Executing ${this.checks.length} pre-migration safety checks...`,
    );

    for (const check of this.checks) {
      loggerService.info(`[MigrationValidator] Running check: ${check.name}`);
      await check.execute(db);
    }
  }
}

export const migrationValidator = new MigrationValidator();
