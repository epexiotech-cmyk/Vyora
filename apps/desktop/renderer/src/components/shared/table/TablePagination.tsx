import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function TablePagination({
  page,
  pageSize,
  totalRecords,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-muted-foreground text-sm">
        Showing {Math.min((page - 1) * pageSize + 1, totalRecords)} to{' '}
        {Math.min(page * pageSize, totalRecords)} of {totalRecords} entries
      </div>
      <div className="flex items-center space-x-2">
        <AppButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </AppButton>
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <AppButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </AppButton>
      </div>
    </div>
  );
}
