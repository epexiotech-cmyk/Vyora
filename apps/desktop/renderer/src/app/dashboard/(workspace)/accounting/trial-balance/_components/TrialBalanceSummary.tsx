import { TrialBalanceReport } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { CheckCircle, AlertCircle } from 'lucide-react';
import * as React from 'react';

interface TrialBalanceSummaryProps {
  report: TrialBalanceReport;
}

export function TrialBalanceSummary({ report }: TrialBalanceSummaryProps) {
  const { grandTotalDebit, grandTotalCredit, isBalanced } = report;
  const difference = grandTotalDebit - grandTotalCredit;
  const absDifference = Math.abs(difference);
  const diffType = difference >= 0 ? 'Dr' : 'Cr';

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Debit</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {formatCurrency(grandTotalDebit)}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Credit</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {formatCurrency(grandTotalCredit)}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Difference</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {absDifference === 0 ? (
            <span className="text-gray-400">-</span>
          ) : (
            <>
              {formatCurrency(absDifference)}{' '}
              <span className="text-sm font-normal text-gray-500">{diffType}</span>
            </>
          )}
        </p>
      </div>
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
          {isBalanced ? 'Debits equal Credits' : 'Debits and Credits do not match'}
        </p>
      </div>
    </div>
  );
}
