import { BalanceSheetGroup, BalanceSheetRow } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

export type FlatBalanceSheetRow =
  | { type: 'group'; group: BalanceSheetGroup; indentLevel: number }
  | { type: 'ledger'; ledger: BalanceSheetRow; indentLevel: number };

/**
 * Recursively prunes empty branches when hideZeroBalances is true.
 * A group is considered empty if it has no ledgers (after filtering out 0 balance ledgers)
 * AND it has no subGroups (after recursive pruning)
 * AND its totalBalance is 0.
 */
function pruneBranch(
  group: BalanceSheetGroup,
  hideZeroBalances: boolean,
): BalanceSheetGroup | null {
  if (!hideZeroBalances) return group;

  // Prune subGroups
  const prunedSubGroups = group.subGroups
    .map((subGroup) => pruneBranch(subGroup, hideZeroBalances))
    .filter((g): g is BalanceSheetGroup => g !== null);

  // Prune ledgers
  const prunedLedgers = group.ledgers.filter((ledger) => ledger.balance.amount !== 0);

  const hasLedgers = prunedLedgers.length > 0;
  const hasChildren = prunedSubGroups.length > 0;
  const hasBalance = group.totalBalance.amount !== 0;

  if (!hasLedgers && !hasChildren && !hasBalance) {
    return null;
  }

  return {
    ...group,
    subGroups: prunedSubGroups,
    ledgers: prunedLedgers,
  };
}

export function flattenBalanceSheetGroups(
  groups: BalanceSheetGroup[],
  currentIndent: number,
  hideZeroBalances: boolean,
): FlatBalanceSheetRow[] {
  let result: FlatBalanceSheetRow[] = [];

  for (const originalGroup of groups) {
    const group = pruneBranch(originalGroup, hideZeroBalances);
    if (!group) continue;

    result.push({ type: 'group', group, indentLevel: currentIndent });

    for (const ledger of group.ledgers) {
      result.push({ type: 'ledger', ledger, indentLevel: currentIndent + 1 });
    }

    if (group.subGroups && group.subGroups.length > 0) {
      // Pass hideZeroBalances as false here because we already pruned the tree in pruneBranch
      result = result.concat(flattenBalanceSheetGroups(group.subGroups, currentIndent + 1, false));
    }
  }

  return result;
}

interface BalanceSheetSectionProps {
  groups: BalanceSheetGroup[];
  hideZeroBalances: boolean;
  totalTitle?: string;
  totalAmount?: number;
}

export function BalanceSheetSection({
  groups,
  hideZeroBalances,
  totalTitle,
  totalAmount,
}: BalanceSheetSectionProps) {
  const flatRows = React.useMemo(() => {
    return flattenBalanceSheetGroups(groups, 0, hideZeroBalances);
  }, [groups, hideZeroBalances]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200 bg-white">
            {flatRows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                  No accounts to display.
                </td>
              </tr>
            ) : (
              flatRows.map((row, idx) => {
                if (row.type === 'group') {
                  const { group, indentLevel } = row;
                  return (
                    <tr key={`g-${group.groupId}-${idx}`} className="bg-gray-50/50">
                      <td
                        className="px-6 py-3 text-sm font-semibold whitespace-nowrap text-gray-900"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {group.groupName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                        {group.totalBalance.amount > 0
                          ? formatCurrency(group.totalBalance.amount)
                          : ''}
                      </td>
                    </tr>
                  );
                } else {
                  const { ledger, indentLevel } = row;
                  return (
                    <tr key={`l-${ledger.ledgerId}-${idx}`} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-3 text-sm whitespace-nowrap text-gray-600"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {ledger.ledgerName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm whitespace-nowrap text-gray-900">
                        {ledger.balance.amount > 0 ? formatCurrency(ledger.balance.amount) : ''}
                      </td>
                    </tr>
                  );
                }
              })
            )}
          </tbody>
        </table>
      </div>
      {totalTitle && totalAmount !== undefined && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-100 px-6 py-4">
          <span className="text-sm font-bold text-gray-900">{totalTitle}</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
      )}
    </div>
  );
}
