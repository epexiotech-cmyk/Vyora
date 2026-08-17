import { ProfitLossGroup, ProfitLossRow } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

export type FlatProfitLossRow =
  | { type: 'group'; group: ProfitLossGroup; indentLevel: number }
  | { type: 'ledger'; ledger: ProfitLossRow; indentLevel: number };

/**
 * Recursively prunes empty branches when hideZeroBalances is true.
 */
function pruneBranch(group: ProfitLossGroup, hideZeroBalances: boolean): ProfitLossGroup | null {
  if (!hideZeroBalances) return group;

  // Prune subGroups
  const prunedSubGroups = group.subGroups
    .map((subGroup) => pruneBranch(subGroup, hideZeroBalances))
    .filter((g): g is ProfitLossGroup => g !== null);

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

export function flattenProfitLossGroups(
  groups: ProfitLossGroup[],
  currentIndent: number,
  hideZeroBalances: boolean,
): FlatProfitLossRow[] {
  let result: FlatProfitLossRow[] = [];

  for (const originalGroup of groups) {
    const group = pruneBranch(originalGroup, hideZeroBalances);
    if (!group) continue;

    result.push({ type: 'group', group, indentLevel: currentIndent });

    for (const ledger of group.ledgers) {
      result.push({ type: 'ledger', ledger, indentLevel: currentIndent + 1 });
    }

    if (group.subGroups && group.subGroups.length > 0) {
      result = result.concat(flattenProfitLossGroups(group.subGroups, currentIndent + 1, false));
    }
  }

  return result;
}

interface ProfitLossSectionProps {
  groups: ProfitLossGroup[];
  hideZeroBalances: boolean;
  totalTitle: string;
  totalAmount: number;
}

export function ProfitLossSection({
  groups,
  hideZeroBalances,
  totalTitle,
  totalAmount,
}: ProfitLossSectionProps) {
  const flatRows = React.useMemo(() => {
    return flattenProfitLossGroups(groups, 0, hideZeroBalances);
  }, [groups, hideZeroBalances]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/50">
            {flatRows.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No accounts to display.
                </td>
              </tr>
            ) : (
              flatRows.map((row, idx) => {
                if (row.type === 'group') {
                  const { group, indentLevel } = row;
                  return (
                    <tr
                      key={`g-${group.groupId}-${idx}`}
                      className="bg-slate-50/50 dark:bg-slate-800/20"
                    >
                      <td
                        className="px-6 py-3 text-sm font-bold whitespace-nowrap text-slate-900 dark:text-slate-100"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {group.groupName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">
                        {group.totalBalance.amount > 0
                          ? formatCurrency(group.totalBalance.amount)
                          : ''}
                      </td>
                    </tr>
                  );
                } else {
                  const { ledger, indentLevel } = row;
                  return (
                    <tr
                      key={`l-${ledger.ledgerId}-${idx}`}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td
                        className="px-6 py-3 text-sm font-medium whitespace-nowrap text-slate-600 dark:text-slate-300"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {ledger.ledgerName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium whitespace-nowrap text-slate-800 dark:text-slate-200">
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
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{totalTitle}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
