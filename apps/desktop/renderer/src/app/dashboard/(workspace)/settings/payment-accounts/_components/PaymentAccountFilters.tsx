import { PaymentAccountType } from '@vyora/types';
import { Search } from 'lucide-react';
import * as React from 'react';

interface PaymentAccountFiltersProps {
  filters: {
    searchQuery?: string;
    accountType?: PaymentAccountType;
    isActive?: boolean;
    showSystemAccounts?: boolean;
  };
  onFilterChange: (filters: Partial<PaymentAccountFiltersProps['filters']>) => void;
}

export function PaymentAccountFilters({ filters, onFilterChange }: PaymentAccountFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      {/* Search Bar Row */}
      <div className="relative w-full">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
        <input
          type="text"
          placeholder="🔍 Search accounts..."
          value={filters.searchQuery || ''}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          className="border-input bg-background/50 placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-3 pr-4 pl-11 text-base shadow-sm transition-colors focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filters.accountType || 'ALL'}
          onChange={(e) =>
            onFilterChange({
              accountType:
                e.target.value === 'ALL' ? undefined : (e.target.value as PaymentAccountType),
            })
          }
          className="border-input bg-background focus:ring-ring h-11 min-w-[160px] cursor-pointer rounded-xl border px-4 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="BANK">Bank Accounts</option>
          <option value="UPI">UPI</option>
          <option value="POS">POS Machine</option>
          <option value="CASH">Cash</option>
        </select>

        <select
          value={filters.isActive === undefined ? 'ALL' : filters.isActive ? 'ACTIVE' : 'INACTIVE'}
          onChange={(e) =>
            onFilterChange({
              isActive: e.target.value === 'ALL' ? undefined : e.target.value === 'ACTIVE',
            })
          }
          className="border-input bg-background focus:ring-ring h-11 min-w-[160px] cursor-pointer rounded-xl border px-4 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <label className="border-input bg-background hover:bg-muted/50 flex h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm shadow-sm transition-colors">
          <input
            type="checkbox"
            checked={filters.showSystemAccounts || false}
            onChange={(e) => onFilterChange({ showSystemAccounts: e.target.checked })}
            className="border-primary text-primary focus:ring-ring h-4 w-4 cursor-pointer rounded focus:ring-1"
          />
          <span className="font-medium select-none">Show system accounts</span>
        </label>
      </div>
    </div>
  );
}
