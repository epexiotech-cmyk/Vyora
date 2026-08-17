import {
  CreateLedgerGroupInput,
  SearchLedgerGroupsOptions,
  LedgerGroupDto,
  LedgerGroupListDto,
  UpdateLedgerGroupInput,
  createLedgerGroupSchema,
  updateLedgerGroupSchema,
  searchLedgerGroupsSchema,
  LedgerDto,
  LedgerListDto,
  CreateLedgerInput,
  UpdateLedgerInput,
  SearchLedgersOptions,
  createLedgerSchema,
  updateLedgerSchema,
  searchLedgersSchema,
} from '@vyora/types';

const RESERVED_SYSTEM_ACCOUNTS = new Set([
  'Sales',
  'Purchase',
  'Cash',
  'Bank',
  'Inventory',
  'Input CGST',
  'Input SGST',
  'Input IGST',
  'Output CGST',
  'Output SGST',
  'Output IGST',
]);

import { ChartOfAccountsRepository } from '../repositories/ChartOfAccountsRepository';

import { companyContextService } from './CompanyContextService';

class ChartOfAccountsService {
  private repo = new ChartOfAccountsRepository();

  public async searchGroups(options: SearchLedgerGroupsOptions): Promise<LedgerGroupListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchLedgerGroupsSchema.parse(options);
    return this.repo.searchGroups(companyId, validOptions);
  }

  public async getAllGroups(): Promise<LedgerGroupDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getAllGroups(companyId);
  }

  public async getGroupById(id: string): Promise<LedgerGroupDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getGroupById(id, companyId);
  }

  public async createGroup(data: CreateLedgerGroupInput): Promise<LedgerGroupDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createLedgerGroupSchema.parse(data);

    // Duplicate name validation
    const existing = await this.repo.getGroupByName(companyId, validData.name);
    if (existing) {
      throw new Error(`A ledger group with the name "${validData.name}" already exists.`);
    }

    // Parent validation
    if (validData.parentGroupId) {
      const parent = await this.repo.getGroupById(validData.parentGroupId, companyId);
      if (!parent) {
        throw new Error('Selected parent group does not exist.');
      }
      if (parent.nature !== validData.nature) {
        throw new Error('Child group nature must match parent group nature.');
      }
    }

    return this.repo.createGroup(companyId, validData);
  }

  public async updateGroup(id: string, data: UpdateLedgerGroupInput): Promise<LedgerGroupDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateLedgerGroupSchema.parse(data);

    const existing = await this.repo.getGroupById(id, companyId);
    if (!existing) {
      throw new Error('Ledger group not found.');
    }

    // System group protection
    if (existing.isSystemGroup && validData.isActive === false) {
      throw new Error('Cannot deactivate a system ledger group.');
    }
    if (existing.isSystemGroup && validData.nature && validData.nature !== existing.nature) {
      throw new Error('Cannot change nature of a system ledger group.');
    }

    // Duplicate name validation
    if (validData.name && validData.name.toLowerCase() !== existing.name.toLowerCase()) {
      const existingName = await this.repo.getGroupByName(companyId, validData.name);
      if (existingName) {
        throw new Error(`A ledger group with the name "${validData.name}" already exists.`);
      }
    }

    // Parent validation & circular dependency
    if (validData.parentGroupId) {
      if (validData.parentGroupId === id) {
        throw new Error('A ledger group cannot be its own parent.');
      }
      const parent = await this.repo.getGroupById(validData.parentGroupId, companyId);
      if (!parent) {
        throw new Error('Selected parent group does not exist.');
      }

      const newNature = validData.nature || existing.nature;
      if (parent.nature !== newNature) {
        throw new Error('Child group nature must match parent group nature.');
      }

      // Simplistic circular dependency check (checking just the immediate parent)
      if (parent.parentGroupId === id) {
        throw new Error('Circular dependency detected.');
      }
    }

    return this.repo.updateGroup(id, companyId, validData);
  }

  public async deactivateGroup(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const existing = await this.repo.getGroupById(id, companyId);
    if (!existing) {
      throw new Error('Ledger group not found.');
    }

    if (existing.isSystemGroup) {
      throw new Error('Cannot deactivate a system ledger group.');
    }

    // Checking if there are children groups active
    const allGroups = await this.repo.getAllGroups(companyId);
    const hasChildren = allGroups.some((g) => g.parentGroupId === id && g.isActive);
    if (hasChildren) {
      throw new Error('Cannot deactivate group: It has active child groups.');
    }

    // Note: checking for active ledgers using this group would go here,
    // but ledger implementation is for Phase 8.9.1.2.

    await this.repo.deactivateGroup(id, companyId);
  }

  // ============================================================================
  // LEDGERS
  // ============================================================================

  public async searchLedgers(options: SearchLedgersOptions): Promise<LedgerListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validOptions = searchLedgersSchema.parse(options);
    return this.repo.searchLedgers(companyId, validOptions);
  }

  public async getLedgerById(id: string): Promise<LedgerDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    return this.repo.getLedgerById(id, companyId);
  }

  public async createLedger(data: CreateLedgerInput): Promise<LedgerDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = createLedgerSchema.parse(data);

    // 1. Duplicate Validation
    const existing = await this.repo.getLedgerByNameAndGroup(
      companyId,
      validData.groupId,
      validData.name,
    );
    if (existing) {
      throw new Error(`A ledger with the name "${validData.name}" already exists in this group.`);
    }

    // 2. Group verification
    const group = await this.repo.getGroupById(validData.groupId, companyId);
    if (!group) throw new Error('Selected ledger group does not exist.');

    return this.repo.createLedger(companyId, validData);
  }

  public async updateLedger(id: string, data: UpdateLedgerInput): Promise<LedgerDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const validData = updateLedgerSchema.parse(data);
    const existing = await this.repo.getLedgerById(id, companyId);
    if (!existing) throw new Error('Ledger not found.');

    // 1. System Account Protection & Group change protection
    if (existing.isSystemAccount) {
      if (validData.groupId && validData.groupId !== existing.groupId) {
        throw new Error('Cannot change the group of a system ledger.');
      }
      if (
        validData.name &&
        validData.name !== existing.name &&
        RESERVED_SYSTEM_ACCOUNTS.has(existing.name)
      ) {
        throw new Error(`Cannot rename reserved system account: ${existing.name}`);
      }
    }

    // 2. Reference Protection
    if (existing.referenceType !== 'MANUAL') {
      throw new Error(
        'Only manually created ledgers can be modified here. Other ledgers must be managed through their respective modules.',
      );
    }

    // 3. Frozen Protection
    if (existing.isFrozen) {
      throw new Error('Cannot modify a frozen ledger.');
    }

    // 4. Duplicate Validation
    if (validData.name || validData.groupId) {
      const targetName = validData.name || existing.name;
      const targetGroupId = validData.groupId || existing.groupId;
      if (
        targetName.toLowerCase() !== existing.name.toLowerCase() ||
        targetGroupId !== existing.groupId
      ) {
        const duplicate = await this.repo.getLedgerByNameAndGroup(
          companyId,
          targetGroupId,
          targetName,
        );
        if (duplicate) {
          throw new Error(
            `A ledger with the name "${targetName}" already exists in the selected group.`,
          );
        }
      }
    }

    // 5. Opening Balance Protection
    if (validData.openingBalance != null && validData.openingBalance !== existing.openingBalance) {
      if (validData.openingBalance < 0) {
        throw new Error('Opening balance must be greater than or equal to 0.');
      }
      const hasTransactions = await this.repo.hasTransactions(id);
      if (hasTransactions) {
        throw new Error(
          'Cannot change opening balance: Transactions already exist for this ledger.',
        );
      }
    }

    return this.repo.updateLedger(id, companyId, validData);
  }

  public async deactivateLedger(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company selected');

    const existing = await this.repo.getLedgerById(id, companyId);
    if (!existing) throw new Error('Ledger not found.');

    // 1. System Account Protection
    if (existing.isSystemAccount) {
      throw new Error('Cannot deactivate a system ledger.');
    }

    // 2. Reference Protection
    if (existing.referenceType !== 'MANUAL') {
      throw new Error(
        'Only manually created ledgers can be deactivated here. Other ledgers must be deactivated through their respective modules.',
      );
    }

    // 3. Frozen Protection
    if (existing.isFrozen) {
      throw new Error('Cannot deactivate a frozen ledger.');
    }

    // 4. Balance check & Transactions
    const hasTransactions = await this.repo.hasTransactions(id);
    if (hasTransactions || existing.openingBalance !== 0) {
      throw new Error(
        'Cannot deactivate ledger: It has a non-zero balance or existing transactions.',
      );
    }

    await this.repo.deactivateLedger(id, companyId);
  }
}

export const chartOfAccountsService = new ChartOfAccountsService();
