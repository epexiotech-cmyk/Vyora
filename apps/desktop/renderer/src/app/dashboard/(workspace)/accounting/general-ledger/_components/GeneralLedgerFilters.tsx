import { LedgerDto } from '@vyora/types';
import * as React from 'react';

import { useLedgers } from '../../chart-of-accounts/hooks/useLedgers';

export interface GeneralLedgerFilterValues {
  ledgerId: string;
  startDate: string;
  endDate: string;
  voucherType: string;
  showCancelled: boolean;
}

interface GeneralLedgerFiltersProps {
  filters: GeneralLedgerFilterValues;
  onChange: (filters: GeneralLedgerFilterValues) => void;
  onApply: () => void;
  isLoading: boolean;
}

export function GeneralLedgerFilters({
  filters,
  onChange,
  onApply,
  isLoading,
}: GeneralLedgerFiltersProps) {
  const { data: ledgersResponse } = useLedgers();
  const ledgers = ledgersResponse || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    onChange({ ...filters, [name]: val });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ledger</label>
          <select
            name="ledgerId"
            value={filters.ledgerId}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="all">All Ledgers</option>
            {ledgers.map((l: LedgerDto) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Voucher Type</label>
          <select
            name="voucherType"
            value={filters.voucherType}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="Journal">Journal</option>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Receipt">Receipt</option>
            <option value="Payment">Payment</option>
            <option value="Contra">Contra</option>
            <option value="CreditNote">Credit Note</option>
            <option value="DebitNote">Debit Note</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showCancelled"
            name="showCancelled"
            checked={filters.showCancelled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="showCancelled" className="text-sm text-gray-700">
            Show Cancelled Vouchers
          </label>
        </div>

        <button
          onClick={onApply}
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
}
