import { FileText } from 'lucide-react';
import * as React from 'react';

export function GeneralLedgerEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 shadow-sm">
      <div className="rounded-full bg-gray-50 p-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No General Ledger Data</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
        No ledger statements found for the selected criteria. Try adjusting your filters or date
        range.
      </p>
    </div>
  );
}
