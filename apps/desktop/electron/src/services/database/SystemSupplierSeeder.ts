import { SupplierProfileDto } from '@vyora/types';

import { TransactionExecutor } from '../../repositories/BaseRepository';
import { SupplierRepository } from '../../repositories/SupplierRepository';

export class SystemSupplierSeeder {
  private supplierRepo = new SupplierRepository();

  public getOrCreateMiscellaneousSupplierSync(
    companyId: string,
    tx: TransactionExecutor,
  ): SupplierProfileDto {
    const existing = this.supplierRepo.getSystemSupplierSync(companyId, tx);
    if (existing) {
      return existing;
    }

    const supplierCode = this.supplierRepo.getNextSupplierCodeSync(companyId, tx);

    return this.supplierRepo.createSync(
      companyId,
      {
        name: 'Miscellaneous Expenses',
        supplierCode,
        isSystem: true,
        isActive: true,
        registrationType: 'Unregistered',
        openingBalance: 0,
        creditLimit: 0,
        creditDays: 0,
      },
      tx,
    );
  }
}

export const systemSupplierSeeder = new SystemSupplierSeeder();
