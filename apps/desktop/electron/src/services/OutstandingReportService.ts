import { OutstandingSummaryDto, OutstandingSummaryRowDto } from '@vyora/types';

import { balanceComputationService } from './BalanceComputationService';
import { journalQueryService } from './JournalQueryService';

export class OutstandingReportService {
  /**
   * Generates the Outstanding Summary for either Customers or Suppliers.
   */
  public async getOutstandingSummary(
    companyId: string,
    financialYearId: string,
    reportType: 'CUSTOMER' | 'SUPPLIER',
    asOfDate?: Date,
  ): Promise<OutstandingSummaryDto> {
    // 1. Fetch Ledger Groups
    const groups = await journalQueryService.getLedgerGroups(companyId);

    // We need to resolve the root group id for Debtors or Creditors based on reportType
    // For Vyora ERP, usually 'Sundry Debtors' or 'Sundry Creditors'.
    const rootGroupName = reportType === 'CUSTOMER' ? 'Sundry Debtors' : 'Sundry Creditors';
    const rootGroup = groups.find((g) => g.name === rootGroupName);

    if (!rootGroup) {
      throw new Error(`Root group ${rootGroupName} not found`);
    }

    // Recursively find all child group IDs
    const targetGroupIds = new Set<string>();
    targetGroupIds.add(rootGroup.id);
    let added = true;
    while (added) {
      added = false;
      for (const g of groups) {
        if (g.parentId && targetGroupIds.has(g.parentId) && !targetGroupIds.has(g.id)) {
          targetGroupIds.add(g.id);
          added = true;
        }
      }
    }

    // 2. Fetch Bulk Ledger Movements
    const movements = await journalQueryService.getBulkLedgerMovements(
      companyId,
      financialYearId,
      asOfDate,
      false, // exclude inactive
    );

    // Filter movements by target groups
    const targetMovements = movements.filter((m) => targetGroupIds.has(m.groupId));

    // 3. Compute Closing Balances
    const closingBalances = balanceComputationService.computeBulkClosingBalances(targetMovements);

    // 4. Assemble Outstanding Summary Rows
    let totalDebit = 0;
    let totalCredit = 0;

    const rows: OutstandingSummaryRowDto[] = closingBalances.map((cb) => {
      const balance = cb.closingBalance;
      if (balance.type === 'Dr') totalDebit += balance.amount;
      else totalCredit += balance.amount;

      return {
        ledgerId: cb.ledgerId,
        ledgerName: cb.ledgerName,
        closingBalance: balance,
      };
    });

    // Compute Total Outstanding Balance
    const totalBalance = balanceComputationService.calculateNetBalance(
      0,
      'Dr',
      totalDebit,
      totalCredit,
    );

    // 5. Return DTO
    return {
      companyId,
      financialYearId,
      reportType,
      asOfDate,
      rows,
      totalBalance,
    };
  }

  // Future Extension Point for Ageing
  // public async getOutstandingAgeing(...)
}

export const outstandingReportService = new OutstandingReportService();
