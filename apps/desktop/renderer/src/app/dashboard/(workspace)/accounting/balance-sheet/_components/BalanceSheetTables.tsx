import { BalanceSheetReport, BalanceSheetGroup } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

import { BalanceSheetSection } from './BalanceSheetSection';

interface BalanceSheetTablesProps {
  report: BalanceSheetReport;
  hideZeroBalances: boolean;
}

export function BalanceSheetTables({ report, hideZeroBalances }: BalanceSheetTablesProps) {
  // Combine Equity and Liabilities for the Left Side
  const liabilitiesAndEquityGroups: BalanceSheetGroup[] = [
    ...report.equityGroups,
    ...report.liabilityGroups,
  ];

  const totalLiabilitiesAndEquity = report.totalLiabilities.amount + report.totalEquity.amount;

  return (
    <div className="mb-6 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 divide-y divide-gray-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Liabilities & Equity (Left Side) */}
        <div className="flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h3 className="text-center text-sm font-semibold tracking-wider text-gray-700 uppercase">
              Liabilities & Equity
            </h3>
          </div>
          <BalanceSheetSection
            groups={liabilitiesAndEquityGroups}
            hideZeroBalances={hideZeroBalances}
            totalTitle="Total Liabilities & Equity"
            totalAmount={totalLiabilitiesAndEquity}
          />
        </div>

        {/* Assets (Right Side) */}
        <div className="flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h3 className="text-center text-sm font-semibold tracking-wider text-gray-700 uppercase">
              Assets
            </h3>
          </div>
          <BalanceSheetSection
            groups={report.assetGroups}
            hideZeroBalances={hideZeroBalances}
            totalTitle="Total Assets"
            totalAmount={report.totalAssets.amount}
          />
        </div>
      </div>

      {/* Difference / Balance Footer */}
      {!report.isBalanced && report.difference.amount !== 0 && (
        <div className="flex items-center justify-between border-t border-red-200 bg-red-50 px-6 py-4">
          <span className="text-lg font-bold text-red-800">
            Difference in Opening Balances / Unbalanced Amount
          </span>
          <span className="text-lg font-bold text-red-800">
            {formatCurrency(report.difference.amount)}
          </span>
        </div>
      )}
    </div>
  );
}
