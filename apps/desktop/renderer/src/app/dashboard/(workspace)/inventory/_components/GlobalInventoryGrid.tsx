'use client';

import { GlobalInventoryRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { getInventoryHealthStatus, InventoryHealthStatus } from '../lib/inventory-health';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { ColumnDef, DataTable } from '@/components/shared/table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

export interface GlobalInventoryGridProps {
  data: GlobalInventoryRowDto[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showNegativeOnly?: boolean;
  onToggleNegativeOnly?: () => void;
  statusFilter?: InventoryHealthStatus | 'ALL';
  onStatusFilterChange?: (status: InventoryHealthStatus | 'ALL') => void;
}

export function GlobalInventoryGrid({
  data,
  isLoading,
  searchQuery,
  onSearchChange,
  showNegativeOnly,
  onToggleNegativeOnly,
  statusFilter = 'ALL',
  onStatusFilterChange,
}: GlobalInventoryGridProps) {
  const router = useRouter();
  const { context } = useCompanyContext();

  const columns: ColumnDef<GlobalInventoryRowDto>[] = [
    {
      key: 'productName',
      header: 'Product',
      cell: (item) => <span className="font-medium">{item.productName}</span>,
    },
    {
      key: 'productSku',
      header: 'SKU',
      cell: (item) => <span className="text-muted-foreground">{item.productSku || '-'}</span>,
    },
    {
      key: 'unitShortName',
      header: 'Unit',
      cell: (item) => <span className="text-muted-foreground">{item.unitShortName}</span>,
    },
    {
      key: 'currentQty',
      header: 'Current Qty',
      cell: (item) => {
        const status = getInventoryHealthStatus(item.currentQty, item.reorderLevel);
        return (
          <div className="flex flex-col">
            <span
              className={cn(
                'font-medium',
                status === 'NEGATIVE'
                  ? 'text-destructive font-semibold'
                  : status === 'LOW'
                    ? 'text-warning font-semibold'
                    : 'text-foreground',
              )}
            >
              {item.currentQty}
            </span>
          </div>
        );
      },
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      cell: (item) => <span className="text-muted-foreground">{item.reorderLevel}</span>,
    },
    {
      key: 'currentWacPaise',
      header: 'Current WAC',
      cell: (item) => (
        <span className="text-muted-foreground">
          {formatMoney(item.currentWacPaise, context?.currency)}
        </span>
      ),
    },
    {
      key: 'currentValuePaise',
      header: 'Current Value',
      cell: (item) => (
        <span className="font-medium">
          {formatMoney(item.currentValuePaise, context?.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => {
        const status = getInventoryHealthStatus(item.currentQty, item.reorderLevel);
        if (status === 'NEGATIVE')
          return <StatusBadge variant="destructive">Negative Stock</StatusBadge>;
        if (status === 'LOW') return <StatusBadge variant="warning">Low Stock</StatusBadge>;
        if (status === 'ZERO') return <StatusBadge variant="secondary">Zero Stock</StatusBadge>;
        return <StatusBadge variant="success">In Stock</StatusBadge>;
      },
    },
  ];

  // Client-side filtering
  const filteredData = React.useMemo(() => {
    let result = data;

    if (showNegativeOnly) {
      result = result.filter((row) => row.currentQty < 0);
    } else if (statusFilter !== 'ALL') {
      result = result.filter(
        (row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === statusFilter,
      );
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.productName.toLowerCase().includes(lowerQuery) ||
          (row.productSku && row.productSku.toLowerCase().includes(lowerQuery)),
      );
    }

    return result;
  }, [data, searchQuery, showNegativeOnly, statusFilter]);

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      keyExtractor={(item) => item.productId}
      isLoading={isLoading}
      onRowClick={(item) => router.push(`/dashboard/inventory/view?productId=${item.productId}`)}
      rowClassName={(item) => {
        const status = getInventoryHealthStatus(item.currentQty, item.reorderLevel);
        if (status === 'NEGATIVE') return 'bg-destructive/5 hover:bg-destructive/10';
        if (status === 'LOW') return 'bg-warning/5 hover:bg-warning/10';
        return '';
      }}
      toolbar={{
        searchQuery,
        onSearchChange,
        placeholder: 'Search by product name or SKU...',
        actions: (
          <div className="flex items-center space-x-4">
            {onStatusFilterChange ? (
              <select
                className="border-input bg-background focus:ring-primary rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
                value={statusFilter}
                onChange={(e) =>
                  onStatusFilterChange(e.target.value as InventoryHealthStatus | 'ALL')
                }
              >
                <option value="ALL">All Status</option>
                <option value="NEGATIVE">Negative Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="ZERO">Zero Stock</option>
                <option value="IN_STOCK">In Stock</option>
              </select>
            ) : onToggleNegativeOnly && showNegativeOnly !== undefined ? (
              <label className="flex cursor-pointer items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="text-primary focus:ring-primary rounded border-gray-300"
                  checked={showNegativeOnly}
                  onChange={onToggleNegativeOnly}
                />
                <span>Negative Stock Only</span>
              </label>
            ) : null}
          </div>
        ),
      }}
    />
  );
}
