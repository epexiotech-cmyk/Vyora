import * as React from 'react';

export interface TrialBalanceFilterValues {
  asOfDate: string;
  hideZeroBalances: boolean;
}

interface TrialBalanceFiltersProps {
  filters: TrialBalanceFilterValues;
  onChange: (filters: TrialBalanceFilterValues) => void;
  onApply: () => void;
  isLoading: boolean;
}

export function TrialBalanceFilters({
  filters,
  onChange,
  onApply,
  isLoading,
}: TrialBalanceFiltersProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    onChange({ ...filters, [name]: val });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full md:w-64">
          <label className="mb-1 block text-sm font-medium text-gray-700">As of Date</label>
          <input
            type="date"
            name="asOfDate"
            value={filters.asOfDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          />
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hideZeroBalances"
              name="hideZeroBalances"
              checked={filters.hideZeroBalances}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hideZeroBalances" className="text-sm text-gray-700">
              Hide Zero Balances
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
    </div>
  );
}
