import { Building2 } from 'lucide-react';
import * as React from 'react';

export function BalanceSheetEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 shadow-sm">
      <div className="rounded-full bg-gray-50 p-4">
        <Building2 className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No Balance Sheet Data</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
        No accounts found for the selected period, or all accounts have zero balances.
      </p>
    </div>
  );
}
