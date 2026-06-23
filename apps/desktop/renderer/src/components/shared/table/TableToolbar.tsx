import { Search } from 'lucide-react';
import * as React from 'react';

import { AppInput } from '@/components/ui/AppInput';

export interface TableToolbarProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  actions,
  filters,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex flex-1 items-center space-x-2">
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <AppInput
              type="search"
              placeholder={placeholder}
              className="pl-8"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {filters && <div className="flex items-center">{filters}</div>}
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
}
