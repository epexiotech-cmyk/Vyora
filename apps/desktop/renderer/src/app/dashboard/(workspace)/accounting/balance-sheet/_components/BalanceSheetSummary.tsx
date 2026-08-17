import { BalanceSheetReport } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { CheckCircle, AlertCircle, Building2, Landmark, Coins } from 'lucide-react';
import * as React from 'react';

interface BalanceSheetSummaryProps {
  report: BalanceSheetReport;
}

export function BalanceSheetSummary({ report }: BalanceSheetSummaryProps) {
  const { totalAssets, totalLiabilities, totalEquity, isBalanced } = report;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      {/* Assets (Blue) */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-700">Total Assets</p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-blue-900">
          {formatCurrency(totalAssets.amount)}
        </p>
      </div>

      {/* Liabilities (Orange) */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Landmark className="h-4 w-4 text-orange-600" />
          <p className="text-sm font-medium text-orange-700">Total Liabilities</p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-orange-900">
          {formatCurrency(totalLiabilities.amount)}
        </p>
      </div>

      {/* Equity (Purple) */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Coins className="h-4 w-4 text-purple-600" />
          <p className="text-sm font-medium text-purple-700">Total Equity</p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-purple-900">
          {formatCurrency(totalEquity.amount)}
        </p>
      </div>

      {/* Balanced Status (Green/Red) */}
      <div
        className={`flex flex-col justify-center rounded-lg border p-4 shadow-sm ${isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
      >
        <div className="flex items-center space-x-2">
          {isBalanced ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <p className={`text-lg font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
            {isBalanced ? 'Balanced' : 'Unbalanced'}
          </p>
        </div>
        <p className={`mt-1 text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
          {isBalanced ? 'Assets = Liabilities + Equity' : 'Equation does not match'}
        </p>
      </div>
    </div>
  );
}
