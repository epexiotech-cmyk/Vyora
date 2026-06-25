import { TrialBalanceGroup, MonetaryBalance } from '@vyora/types';

export class TrialBalanceAggregationService {
  /**
   * Merges ledger balances into an intermediate aggregation tree and detects cyclic hierarchies.
   */
  public aggregate(
    ledgerBalances: {
      ledgerId: string;
      ledgerName: string;
      groupId: string;
      closingBalance: MonetaryBalance;
    }[],
    allGroups: { id: string; name: string; parentId: string | null; nature: string }[],
  ): TrialBalanceGroup[] {
    const groupMap = new Map<string, TrialBalanceGroup>();

    // 1. Initialize all groups
    for (const g of allGroups) {
      groupMap.set(g.id, {
        groupId: g.id,
        groupName: g.name,
        parentGroupId: g.parentId,
        nature: g.nature as TrialBalanceGroup['nature'],
        totalBalance: { amount: 0, type: 'Dr' },
        ledgers: [],
        subGroups: [],
      });
    }

    // 2. Attach ledgers to their respective groups
    for (const lb of ledgerBalances) {
      const g = groupMap.get(lb.groupId);
      if (g) {
        g.ledgers.push({
          ledgerId: lb.ledgerId,
          ledgerName: lb.ledgerName,
          groupId: lb.groupId,
          closingBalance: lb.closingBalance,
        });
      }
    }

    // 3. Build tree and calculate totals
    const topLevelGroups: TrialBalanceGroup[] = [];
    const childrenMap = new Map<string, TrialBalanceGroup[]>();

    for (const g of groupMap.values()) {
      if (g.parentGroupId) {
        if (!childrenMap.has(g.parentGroupId)) childrenMap.set(g.parentGroupId, []);
        childrenMap.get(g.parentGroupId)!.push(g);
      }
    }

    const computeGroupTotal = (groupId: string, visited: Set<string>): number => {
      if (visited.has(groupId)) {
        throw new Error(`Cyclic hierarchy detected at group ${groupId}`);
      }
      visited.add(groupId);

      const group = groupMap.get(groupId);
      if (!group) return 0;

      let netValue = 0;

      // Add ledgers
      for (const l of group.ledgers) {
        const val =
          l.closingBalance.type === 'Dr' ? l.closingBalance.amount : -l.closingBalance.amount;
        netValue += val;
      }

      // Add children
      const children = childrenMap.get(groupId) || [];
      for (const child of children) {
        netValue += computeGroupTotal(child.groupId, new Set(visited));
        group.subGroups.push(child);
      }

      group.totalBalance = {
        amount: Math.abs(netValue),
        type: netValue >= 0 ? 'Dr' : 'Cr',
      };

      return netValue;
    };

    // Find top-level groups and compute their trees
    for (const g of groupMap.values()) {
      if (!g.parentGroupId) {
        computeGroupTotal(g.groupId, new Set());
        topLevelGroups.push(g);
      }
    }

    return topLevelGroups;
  }
}

export const trialBalanceAggregationService = new TrialBalanceAggregationService();
