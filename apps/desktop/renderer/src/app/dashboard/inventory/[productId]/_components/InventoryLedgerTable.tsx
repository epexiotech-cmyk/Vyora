'use client';

import { StockMovementDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { ColumnDef, DataTable } from '@/components/shared/table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();

interface InventoryLedgerTableProps {
  ledger: StockMovementDto[];
  isLoading: boolean;
}

export function InventoryLedgerTable({ ledger, isLoading }: InventoryLedgerTableProps) {
  const { context } = useCompanyContext();
  const [page, setPage] = React.useState(0);
  const pageSize = 15;

  const paginatedData = React.useMemo(() => {
    const start = page * pageSize;
    return ledger.slice(start, start + pageSize);
  }, [ledger, page, pageSize]);

  const columns: ColumnDef<StockMovementDto>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (item) => formatDate(item.movementDate.toString()),
    },
    {
      key: 'type',
      header: 'Movement Type',
      cell: (item) => {
        let variant: 'default' | 'success' | 'destructive' | 'warning' = 'default';
        if (item.movementType === 'PURCHASE' || item.movementType === 'SALE_REVERSAL') {
          variant = 'success';
        } else if (item.movementType === 'SALE' || item.movementType === 'PURCHASE_REVERSAL') {
          variant = 'warning';
        }
        return <StatusBadge variant={variant}>{item.movementType}</StatusBadge>;
      },
    },
    {
      key: 'refType',
      header: 'Ref Type',
      cell: (item) => item.referenceType,
    },
    {
      key: 'refId',
      header: 'Ref ID',
      cell: (item) => <span className="font-mono text-xs">{item.referenceId.slice(0, 8)}...</span>,
    },
    {
      key: 'qtyIn',
      header: 'Qty In',
      className: 'text-right text-green-600 dark:text-green-400 font-medium',
      cell: (item) => (item.quantityIn > 0 ? `+${item.quantityIn}` : '-'),
    },
    {
      key: 'qtyOut',
      header: 'Qty Out',
      className: 'text-right text-orange-600 dark:text-orange-400 font-medium',
      cell: (item) => (item.quantityOut > 0 ? `-${item.quantityOut}` : '-'),
    },
    {
      key: 'rate',
      header: 'Rate',
      className: 'text-right',
      cell: (item) => formatMoney(item.rate, context!.currency),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      cell: (item) => (
        <span className="text-muted-foreground inline-block max-w-[150px] truncate">
          {item.remarks || '-'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={paginatedData}
      columns={columns}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      emptyMessage="No stock movements recorded for this item."
      pagination={
        ledger.length > 0
          ? {
              page: page + 1,
              pageSize: pageSize,
              onPageChange: (newPage) => setPage(newPage - 1),
              totalRecords: ledger.length,
            }
          : undefined
      }
    />
  );
}
