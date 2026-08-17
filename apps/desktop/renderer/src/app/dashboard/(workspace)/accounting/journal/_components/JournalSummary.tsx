'use client';

import * as React from 'react';

interface JournalSummaryProps {
  totalDebit: number;
  totalCredit: number;
}

export function JournalSummary({ totalDebit, totalCredit }: JournalSummaryProps) {
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="flex items-center justify-end gap-6 rounded-md bg-gray-50 p-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-500">Total Debit</p>
        <p className="text-lg font-semibold text-gray-900">₹ {(totalDebit / 100).toFixed(2)}</p>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-gray-500">Total Credit</p>
        <p className="text-lg font-semibold text-gray-900">₹ {(totalCredit / 100).toFixed(2)}</p>
      </div>

      <div className="mx-2 h-10 w-px bg-gray-300" />

      <div className="text-right">
        <p className="text-sm font-medium text-gray-500">Difference</p>
        <p
          className={`text-lg font-semibold ${
            difference === 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          ₹ {(difference / 100).toFixed(2)}
        </p>
      </div>

      {isBalanced ? (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
          Balanced
        </span>
      ) : (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
          Out of Balance
        </span>
      )}
    </div>
  );
}
