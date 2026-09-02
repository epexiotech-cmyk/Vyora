import { TrialBalanceReport, TrialBalanceGroup, TrialBalanceRow } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

interface TrialBalanceTableProps {
  report: TrialBalanceReport;
  hideZeroBalances: boolean;
}

type FlatRow =
  | { type: 'group'; group: TrialBalanceGroup; indentLevel: number }
  | { type: 'ledger'; ledger: TrialBalanceRow; indentLevel: number };

/**
 * Recursively prunes empty branches when hideZeroBalances is true.
 */
export function pruneBranch(
  group: TrialBalanceGroup,
  hideZeroBalances: boolean,
): TrialBalanceGroup | null {
  if (!hideZeroBalances) return group;

  // Prune subGroups
  const prunedSubGroups = group.subGroups
    .map((subGroup) => pruneBranch(subGroup, hideZeroBalances))
    .filter((g): g is TrialBalanceGroup => g !== null);

  // Prune ledgers
  const prunedLedgers = group.ledgers.filter((ledger) => ledger.closingBalance.amount !== 0);

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

export function flattenGroups(
  groups: TrialBalanceGroup[],
  currentIndent: number,
  hideZeroBalances: boolean,
): FlatRow[] {
  let result: FlatRow[] = [];

  for (const originalGroup of groups) {
    const group = pruneBranch(originalGroup, hideZeroBalances);
    if (!group) continue;

    result.push({ type: 'group', group, indentLevel: currentIndent });

    for (const ledger of group.ledgers) {
      result.push({ type: 'ledger', ledger, indentLevel: currentIndent + 1 });
    }

    if (group.subGroups && group.subGroups.length > 0) {
      result = result.concat(flattenGroups(group.subGroups, currentIndent + 1, false));
    }
  }

  return result;
}

export function TrialBalanceTable({ report, hideZeroBalances }: TrialBalanceTableProps) {
  const flatRows = React.useMemo(() => {
    return flattenGroups(report.groups, 0, hideZeroBalances);
  }, [report.groups, hideZeroBalances]);

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Account / Group
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Debit (Dr)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Credit (Cr)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {flatRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  No data to display.
                </td>
              </tr>
            ) : (
              flatRows.map((row, idx) => {
                if (row.type === 'group') {
                  const { group, indentLevel } = row;
                  const isDebit = group.totalBalance.type === 'Dr';
                  const isCredit = group.totalBalance.type === 'Cr';
                  return (
                    <tr key={`g-${group.groupId}-${idx}`} className="bg-gray-50/50">
                      <td
                        className="px-6 py-3 text-sm font-semibold whitespace-nowrap text-gray-900"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {group.groupName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                        {isDebit && group.totalBalance.amount > 0
                          ? formatCurrency(group.totalBalance.amount)
                          : ''}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                        {isCredit && group.totalBalance.amount > 0
                          ? formatCurrency(group.totalBalance.amount)
                          : ''}
                      </td>
                    </tr>
                  );
                } else {
                  const { ledger, indentLevel } = row;
                  const isDebit = ledger.closingBalance.type === 'Dr';
                  const isCredit = ledger.closingBalance.type === 'Cr';
                  return (
                    <tr key={`l-${ledger.ledgerId}-${idx}`} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-3 text-sm whitespace-nowrap text-gray-600"
                        style={{ paddingLeft: `${1.5 + indentLevel * 1.5}rem` }}
                      >
                        {ledger.ledgerName}
                      </td>
                      <td className="px-6 py-3 text-right text-sm whitespace-nowrap text-green-600">
                        {isDebit && ledger.closingBalance.amount > 0
                          ? formatCurrency(ledger.closingBalance.amount)
                          : ''}
                      </td>
                      <td className="px-6 py-3 text-right text-sm whitespace-nowrap text-red-600">
                        {isCredit && ledger.closingBalance.amount > 0
                          ? formatCurrency(ledger.closingBalance.amount)
                          : ''}
                      </td>
                    </tr>
                  );
                }
              })
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50">
            <tr>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">Grand Total:</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                {formatCurrency(report.grandTotalDebit)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                {formatCurrency(report.grandTotalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
