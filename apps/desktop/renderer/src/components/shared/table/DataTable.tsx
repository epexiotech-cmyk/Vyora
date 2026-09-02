import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { TablePagination, TablePaginationProps } from './TablePagination';
import { TableToolbar, TableToolbarProps } from './TableToolbar';

import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  toolbar?: TableToolbarProps;
  pagination?: TablePaginationProps;
  className?: string;
  rowTestIdExtractor?: (item: T) => string;
  rowClassName?: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  emptyMessage = 'No data available',
  onRowClick,
  toolbar,
  pagination,
  className,
  rowTestIdExtractor,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className={cn('space-y-4', className)}>
      {toolbar && <TableToolbar {...toolbar} />}

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-muted-foreground h-10 px-4 text-left font-medium',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  data-testid={rowTestIdExtractor ? rowTestIdExtractor(item) : undefined}
                  className={cn(
                    'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
                    onRowClick && 'cursor-pointer',
                    rowClassName && rowClassName(item)
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('p-4 align-middle', col.className)}>
                      {col.cell
                        ? col.cell(item)
                        : (item as Record<string, React.ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && <TablePagination {...pagination} />}
    </div>
  );
}
