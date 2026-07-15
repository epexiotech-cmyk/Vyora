'use client';

import { GlobalInventoryRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { ColumnDef, DataTable } from '@/components/shared/table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

export interface GlobalInventoryGridProps {
  data: GlobalInventoryRowDto[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showNegativeOnly: boolean;
  onToggleNegativeOnly: () => void;
}

export function GlobalInventoryGrid({
  data,
  isLoading,
  searchQuery,
  onSearchChange,
  showNegativeOnly,
  onToggleNegativeOnly,
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
      cell: (item) => (
        <span
          className={item.currentQty < 0 ? 'text-destructive font-semibold' : 'text-foreground'}
        >
          {item.currentQty}
        </span>
      ),
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
        if (item.currentQty > 0) {
          return <StatusBadge variant="success">In Stock</StatusBadge>;
        }
        if (item.currentQty < 0) {
          return <StatusBadge variant="destructive">Negative Stock</StatusBadge>;
        }
        return <StatusBadge variant="warning">Zero Stock</StatusBadge>;
      },
    },
  ];

  // Client-side filtering
  const filteredData = React.useMemo(() => {
    let result = data;

    if (showNegativeOnly) {
      result = result.filter((row) => row.currentQty < 0);
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
  }, [data, searchQuery, showNegativeOnly]);

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      keyExtractor={(item) => item.productId}
      isLoading={isLoading}
      onRowClick={(item) => router.push(`/dashboard/inventory/${item.productId}`)}
      toolbar={{
        searchQuery,
        onSearchChange,
        placeholder: 'Search by product name or SKU...',
        actions: (
          <div className="flex items-center space-x-2">
            <label className="flex cursor-pointer items-center space-x-2 text-sm">
              <input
                type="checkbox"
                className="text-primary focus:ring-primary rounded border-gray-300"
                checked={showNegativeOnly}
                onChange={onToggleNegativeOnly}
              />
              <span>Negative Stock Only</span>
            </label>
          </div>
        ),
      }}
    />
  );
}
